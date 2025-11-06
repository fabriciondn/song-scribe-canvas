
-- Sistema de validação de comissões de afiliados (90 dias)
-- 1. Adicionar campo de data de validação nas comissões
-- 2. Criar função para validar comissões automaticamente

-- 1. Adicionar campos de validação
ALTER TABLE affiliate_commissions
ADD COLUMN IF NOT EXISTS validation_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validation_notes TEXT;

-- 2. Criar índice para buscar comissões pendentes de validação
CREATE INDEX IF NOT EXISTS idx_commissions_validation 
ON affiliate_commissions(status, validation_deadline) 
WHERE status = 'pending';

-- 3. Criar função para validar comissões automaticamente
CREATE OR REPLACE FUNCTION validate_affiliate_commissions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_commission RECORD;
  v_has_works BOOLEAN;
  v_approved_count INTEGER := 0;
  v_cancelled_count INTEGER := 0;
  v_result JSONB;
BEGIN
  RAISE NOTICE '🔍 Iniciando validação automática de comissões';
  
  -- Buscar comissões pendentes que atingiram o prazo de 90 dias
  FOR v_commission IN
    SELECT 
      ac.id,
      ac.affiliate_id,
      ac.user_id,
      ac.amount,
      ac.validation_deadline,
      ac.created_at,
      p.email as user_email,
      pa.email as affiliate_email
    FROM affiliate_commissions ac
    JOIN profiles p ON p.id = ac.user_id
    JOIN affiliates a ON a.id = ac.affiliate_id
    JOIN profiles pa ON pa.id = a.user_id
    WHERE ac.status = 'pending'
      AND ac.validation_deadline IS NOT NULL
      AND ac.validation_deadline <= NOW()
      AND ac.validated_at IS NULL
  LOOP
    RAISE NOTICE '📋 Validando comissão ID: % para usuário: %', v_commission.id, v_commission.user_email;
    
    -- Verificar se o usuário registrou alguma obra
    SELECT EXISTS (
      SELECT 1 
      FROM author_registrations 
      WHERE user_id = v_commission.user_id
        AND status IN ('registered', 'completed')
        AND created_at <= v_commission.validation_deadline
    ) INTO v_has_works;
    
    IF v_has_works THEN
      -- Usuário registrou obra - APROVAR comissão
      UPDATE affiliate_commissions
      SET 
        validated_at = NOW(),
        validation_notes = 'Aprovada: Usuário registrou obra dentro do prazo de 90 dias',
        updated_at = NOW()
      WHERE id = v_commission.id;
      
      v_approved_count := v_approved_count + 1;
      
      RAISE NOTICE '✅ Comissão aprovada - Usuário % registrou obra', v_commission.user_email;
      
      -- Log de aprovação
      INSERT INTO user_activity_logs (user_id, action, metadata)
      VALUES (
        v_commission.user_id,
        'affiliate_commission_validated',
        jsonb_build_object(
          'commission_id', v_commission.id,
          'affiliate_email', v_commission.affiliate_email,
          'amount', v_commission.amount,
          'validation_result', 'approved',
          'reason', 'User registered work within 90 days'
        )
      );
      
    ELSE
      -- Usuário NÃO registrou obra - CANCELAR comissão
      UPDATE affiliate_commissions
      SET 
        status = 'cancelled',
        validated_at = NOW(),
        validation_notes = 'Cancelada: Usuário não registrou obra em 90 dias',
        updated_at = NOW()
      WHERE id = v_commission.id;
      
      -- Deduzir do saldo do afiliado
      UPDATE affiliates
      SET 
        total_earnings = GREATEST(total_earnings - v_commission.amount, 0),
        updated_at = NOW()
      WHERE id = v_commission.affiliate_id;
      
      v_cancelled_count := v_cancelled_count + 1;
      
      RAISE NOTICE '❌ Comissão cancelada - Usuário % não registrou obra', v_commission.user_email;
      
      -- Log de cancelamento
      INSERT INTO user_activity_logs (user_id, action, metadata)
      VALUES (
        v_commission.user_id,
        'affiliate_commission_cancelled',
        jsonb_build_object(
          'commission_id', v_commission.id,
          'affiliate_email', v_commission.affiliate_email,
          'amount', v_commission.amount,
          'validation_result', 'cancelled',
          'reason', 'User did not register work within 90 days'
        )
      );
    END IF;
  END LOOP;
  
  v_result := jsonb_build_object(
    'approved_commissions', v_approved_count,
    'cancelled_commissions', v_cancelled_count,
    'total_processed', v_approved_count + v_cancelled_count,
    'processed_at', NOW()
  );
  
  RAISE NOTICE '✅ Validação concluída: % aprovadas, % canceladas', v_approved_count, v_cancelled_count;
  
  RETURN v_result;
END;
$$;

-- 4. Criar tipo de enum para status de comissão (incluindo cancelled)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_status') THEN
    CREATE TYPE commission_status AS ENUM ('pending', 'paid', 'cancelled');
  ELSE
    -- Adicionar 'cancelled' se não existir
    BEGIN
      ALTER TYPE commission_status ADD VALUE IF NOT EXISTS 'cancelled';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 5. Atualizar função de processamento de primeira compra para incluir prazo de validação
CREATE OR REPLACE FUNCTION process_affiliate_first_purchase(
  p_user_id uuid, 
  p_payment_amount numeric, 
  p_payment_id text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_affiliate_code TEXT;
  v_affiliate_id UUID;
  v_affiliate_level affiliate_level;
  v_custom_rate NUMERIC;
  v_commission_rate NUMERIC;
  v_commission_amount NUMERIC;
  v_already_processed BOOLEAN;
  v_has_valid_click BOOLEAN;
  v_user_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  RAISE NOTICE 'Processando primeira compra - User: %, Valor: %, Payment: %', p_user_id, p_payment_amount, p_payment_id;
  
  -- Buscar data de criação do usuário
  SELECT created_at INTO v_user_created_at
  FROM profiles
  WHERE id = p_user_id;
  
  -- 1. Buscar código de parceiro nas notas do perfil
  SELECT moderator_notes INTO v_affiliate_code
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_affiliate_code IS NULL OR v_affiliate_code NOT LIKE '%Indicado por:%' THEN
    RAISE NOTICE 'Usuário não foi indicado por parceiro';
    RETURN FALSE;
  END IF;
  
  v_affiliate_code := regexp_replace(v_affiliate_code, '.*Indicado por:\s*([^\n]+).*', '\1');
  v_affiliate_code := TRIM(v_affiliate_code);
  
  RAISE NOTICE 'Código de parceiro extraído: %', v_affiliate_code;
  
  -- 2. Buscar parceiro
  SELECT id, level, custom_commission_rate 
  INTO v_affiliate_id, v_affiliate_level, v_custom_rate
  FROM affiliates
  WHERE (
    affiliate_code = v_affiliate_code
    OR affiliate_code = 'compuse-' || v_affiliate_code
    OR affiliate_code = regexp_replace(v_affiliate_code, '^compuse-', '')
  )
  AND status = 'approved'
  LIMIT 1;
  
  IF v_affiliate_id IS NULL THEN
    RAISE NOTICE 'Parceiro não encontrado';
    RETURN FALSE;
  END IF;
  
  -- 3. Verificar se existe clique convertido
  SELECT EXISTS (
    SELECT 1 FROM affiliate_clicks 
    WHERE affiliate_id = v_affiliate_id 
    AND user_id = p_user_id
    AND converted = true
  ) INTO v_has_valid_click;
  
  IF NOT v_has_valid_click THEN
    RAISE NOTICE 'Usuário não tem clique válido registrado';
    RETURN FALSE;
  END IF;
  
  -- 4. Verificar se já existe comissão
  SELECT EXISTS (
    SELECT 1 FROM affiliate_commissions
    WHERE affiliate_id = v_affiliate_id
      AND user_id = p_user_id
  ) INTO v_already_processed;
  
  IF v_already_processed THEN
    RAISE NOTICE 'Comissão já processada anteriormente';
    RETURN FALSE;
  END IF;
  
  -- 5. Calcular taxa de comissão
  IF v_custom_rate IS NOT NULL THEN
    v_commission_rate := v_custom_rate;
  ELSE
    v_commission_rate := CASE v_affiliate_level
      WHEN 'bronze' THEN 25.0
      WHEN 'silver' THEN 50.0
      WHEN 'gold' THEN 50.0
      ELSE 25.0
    END;
  END IF;
  
  v_commission_amount := p_payment_amount * (v_commission_rate / 100);
  v_commission_amount := ROUND(v_commission_amount, 2);
  
  -- 6. Criar comissão COM prazo de validação de 90 dias
  INSERT INTO affiliate_commissions (
    affiliate_id,
    user_id,
    type,
    reference_id,
    amount,
    commission_rate,
    status,
    validation_deadline,
    created_at
  ) VALUES (
    v_affiliate_id,
    p_user_id,
    'author_registration',
    COALESCE(p_payment_id::UUID, p_user_id),
    v_commission_amount,
    v_commission_rate,
    'pending', -- Pendente de validação
    v_user_created_at + INTERVAL '90 days', -- 90 dias a partir da criação do usuário
    NOW()
  );
  
  RAISE NOTICE '⏰ Comissão criada com prazo de validação: %', v_user_created_at + INTERVAL '90 days';
  
  -- 7. Atualizar earnings (mas com nota de que está pendente de validação)
  UPDATE affiliates
  SET 
    total_earnings = total_earnings + v_commission_amount,
    total_registrations = total_registrations + 1,
    updated_at = NOW()
  WHERE id = v_affiliate_id;
  
  -- 8. Registrar conversão
  INSERT INTO affiliate_conversions (
    affiliate_id,
    user_id,
    type,
    reference_id,
    click_id
  ) 
  SELECT 
    v_affiliate_id,
    p_user_id,
    'author_registration',
    COALESCE(p_payment_id::UUID, p_user_id),
    id
  FROM affiliate_clicks
  WHERE affiliate_id = v_affiliate_id
    AND user_id = p_user_id
    AND converted = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  RAISE NOTICE '✅ Comissão criada - Aguardando validação em 90 dias';
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- 6. Comentários explicativos
COMMENT ON COLUMN affiliate_commissions.validation_deadline IS 'Data limite para validar se o usuário registrou obra (90 dias)';
COMMENT ON COLUMN affiliate_commissions.validated_at IS 'Data em que a comissão foi validada (aprovada ou cancelada)';
COMMENT ON COLUMN affiliate_commissions.validation_notes IS 'Notas sobre o resultado da validação';
COMMENT ON FUNCTION validate_affiliate_commissions() IS 'Valida comissões pendentes após 90 dias verificando se usuário registrou obra';
