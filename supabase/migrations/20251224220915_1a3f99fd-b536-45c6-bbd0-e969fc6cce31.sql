-- ============================================
-- NOVO SISTEMA DE PLANOS PRO COM CRÉDITOS BÔNUS
-- ============================================

-- 1. Criar tabela para gerenciar créditos bônus da assinatura
CREATE TABLE IF NOT EXISTS public.subscription_credits_bonus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0,
  is_frozen BOOLEAN DEFAULT false,
  frozen_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_user_bonus UNIQUE (user_id)
);

-- Habilitar RLS
ALTER TABLE public.subscription_credits_bonus ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own bonus credits"
ON public.subscription_credits_bonus
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage bonus credits"
ON public.subscription_credits_bonus
FOR ALL
USING (auth.uid() = user_id);

-- 2. Adicionar campo para controle de concessão de créditos mensais
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS last_credit_grant_at TIMESTAMP WITH TIME ZONE;

-- 3. Função para conceder créditos mensais (chamada pelo webhook de pagamento)
CREATE OR REPLACE FUNCTION public.grant_monthly_subscription_credits(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_credits INTEGER;
  v_current_bonus INTEGER;
  v_result jsonb;
BEGIN
  -- Conceder 2 créditos diretos
  UPDATE profiles
  SET credits = COALESCE(credits, 0) + 2
  WHERE id = p_user_id
  RETURNING credits INTO v_current_credits;
  
  -- Conceder 1 crédito bônus (criar ou atualizar)
  INSERT INTO subscription_credits_bonus (user_id, credits, is_frozen, frozen_at, expires_at)
  VALUES (p_user_id, 1, false, NULL, NULL)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    credits = subscription_credits_bonus.credits + 1,
    is_frozen = false,
    frozen_at = NULL,
    expires_at = NULL,
    updated_at = NOW()
  RETURNING credits INTO v_current_bonus;
  
  -- Atualizar última concessão na assinatura
  UPDATE subscriptions
  SET last_credit_grant_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND status = 'active'
    AND plan_type = 'pro';
  
  -- Log da atividade
  INSERT INTO user_activity_logs (user_id, action, metadata)
  VALUES (
    p_user_id,
    'monthly_credits_granted',
    jsonb_build_object(
      'regular_credits_added', 2,
      'bonus_credits_added', 1,
      'total_regular_credits', v_current_credits,
      'total_bonus_credits', v_current_bonus
    )
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'regular_credits_added', 2,
    'bonus_credits_added', 1,
    'total_regular_credits', v_current_credits,
    'total_bonus_credits', v_current_bonus
  );
  
  RETURN v_result;
END;
$$;

-- 4. Função para congelar bônus quando assinatura fica inativa
CREATE OR REPLACE FUNCTION public.freeze_bonus_credits(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE subscription_credits_bonus
  SET 
    is_frozen = true,
    frozen_at = NOW(),
    expires_at = NOW() + INTERVAL '2 months',
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND is_frozen = false
    AND credits > 0;
  
  -- Log da atividade
  INSERT INTO user_activity_logs (user_id, action, metadata)
  VALUES (
    p_user_id,
    'bonus_credits_frozen',
    jsonb_build_object(
      'frozen_at', NOW(),
      'expires_at', NOW() + INTERVAL '2 months'
    )
  );
END;
$$;

-- 5. Função para expirar bônus após 2 meses de inatividade
CREATE OR REPLACE FUNCTION public.expire_frozen_bonus_credits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_record RECORD;
BEGIN
  FOR v_record IN
    SELECT id, user_id, credits
    FROM subscription_credits_bonus
    WHERE is_frozen = true
      AND expires_at IS NOT NULL
      AND expires_at <= NOW()
      AND credits > 0
  LOOP
    -- Zerar créditos bônus
    UPDATE subscription_credits_bonus
    SET 
      credits = 0,
      updated_at = NOW()
    WHERE id = v_record.id;
    
    -- Log da expiração
    INSERT INTO user_activity_logs (user_id, action, metadata)
    VALUES (
      v_record.user_id,
      'bonus_credits_expired',
      jsonb_build_object(
        'expired_credits', v_record.credits,
        'expired_at', NOW()
      )
    );
    
    v_expired_count := v_expired_count + 1;
  END LOOP;
  
  RETURN v_expired_count;
END;
$$;

-- 6. Função para usar créditos (prioriza regulares, depois bônus)
CREATE OR REPLACE FUNCTION public.use_credits_for_registration(p_user_id UUID, p_credits_needed INTEGER DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_regular_credits INTEGER;
  v_bonus_credits INTEGER;
  v_bonus_frozen BOOLEAN;
  v_credits_from_regular INTEGER := 0;
  v_credits_from_bonus INTEGER := 0;
  v_result jsonb;
BEGIN
  -- Buscar créditos regulares
  SELECT credits INTO v_regular_credits
  FROM profiles
  WHERE id = p_user_id;
  
  -- Buscar créditos bônus
  SELECT credits, is_frozen INTO v_bonus_credits, v_bonus_frozen
  FROM subscription_credits_bonus
  WHERE user_id = p_user_id;
  
  v_regular_credits := COALESCE(v_regular_credits, 0);
  v_bonus_credits := COALESCE(v_bonus_credits, 0);
  v_bonus_frozen := COALESCE(v_bonus_frozen, true);
  
  -- Verificar se tem créditos suficientes
  IF v_regular_credits + (CASE WHEN v_bonus_frozen THEN 0 ELSE v_bonus_credits END) < p_credits_needed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Créditos insuficientes',
      'regular_credits', v_regular_credits,
      'bonus_credits', v_bonus_credits,
      'bonus_frozen', v_bonus_frozen
    );
  END IF;
  
  -- Primeiro usar créditos regulares
  IF v_regular_credits >= p_credits_needed THEN
    v_credits_from_regular := p_credits_needed;
  ELSE
    v_credits_from_regular := v_regular_credits;
    -- Depois usar bônus (se não estiver congelado)
    IF NOT v_bonus_frozen THEN
      v_credits_from_bonus := p_credits_needed - v_credits_from_regular;
    END IF;
  END IF;
  
  -- Debitar créditos regulares
  IF v_credits_from_regular > 0 THEN
    UPDATE profiles
    SET credits = credits - v_credits_from_regular
    WHERE id = p_user_id;
  END IF;
  
  -- Debitar créditos bônus
  IF v_credits_from_bonus > 0 THEN
    UPDATE subscription_credits_bonus
    SET credits = credits - v_credits_from_bonus,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Log da utilização
  INSERT INTO user_activity_logs (user_id, action, metadata)
  VALUES (
    p_user_id,
    'credits_used_for_registration',
    jsonb_build_object(
      'regular_credits_used', v_credits_from_regular,
      'bonus_credits_used', v_credits_from_bonus,
      'total_used', p_credits_needed
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'regular_credits_used', v_credits_from_regular,
    'bonus_credits_used', v_credits_from_bonus,
    'remaining_regular', v_regular_credits - v_credits_from_regular,
    'remaining_bonus', v_bonus_credits - v_credits_from_bonus
  );
END;
$$;

-- 7. Trigger para congelar bônus quando assinatura expira
CREATE OR REPLACE FUNCTION public.handle_subscription_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se assinatura ficou inativa/expirada, congelar bônus
  IF NEW.status IN ('expired', 'cancelled', 'inactive') 
     AND OLD.status = 'active' 
     AND NEW.plan_type = 'pro' THEN
    PERFORM freeze_bonus_credits(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS on_subscription_status_change ON public.subscriptions;
CREATE TRIGGER on_subscription_status_change
  AFTER UPDATE OF status ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_status_change();

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_subscription_credits_bonus_user_id 
ON subscription_credits_bonus(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_credits_bonus_frozen 
ON subscription_credits_bonus(is_frozen) 
WHERE is_frozen = true;