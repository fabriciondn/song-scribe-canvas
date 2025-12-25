
-- Tabela de saldo de acordes do usuário
CREATE TABLE public.user_acordes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_acordes INTEGER NOT NULL DEFAULT 0,
  redeemed_acordes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de ações que geram acordes (configurável pelo admin)
CREATE TABLE public.acorde_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  acordes_reward INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  icon TEXT DEFAULT 'Star',
  max_per_user INTEGER DEFAULT NULL, -- NULL = ilimitado
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Histórico de acordes ganhos
CREATE TABLE public.acorde_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_id UUID NOT NULL REFERENCES public.acorde_actions(id),
  acordes_earned INTEGER NOT NULL,
  reference_id UUID DEFAULT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Histórico de resgates de acordes
CREATE TABLE public.acorde_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  acordes_redeemed INTEGER NOT NULL,
  credits_received INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_acordes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acorde_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acorde_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acorde_redemptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_acordes
CREATE POLICY "Users can view their own acordes" 
ON public.user_acordes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all acordes" 
ON public.user_acordes FOR ALL 
USING (true);

-- Políticas RLS para acorde_actions
CREATE POLICY "Anyone can view active actions" 
ON public.acorde_actions FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage actions" 
ON public.acorde_actions FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Políticas RLS para acorde_history
CREATE POLICY "Users can view their own history" 
ON public.acorde_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert history" 
ON public.acorde_history FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all history" 
ON public.acorde_history FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Políticas RLS para acorde_redemptions
CREATE POLICY "Users can view their own redemptions" 
ON public.acorde_redemptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert redemptions" 
ON public.acorde_redemptions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all redemptions" 
ON public.acorde_redemptions FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Inserir ações padrão
INSERT INTO public.acorde_actions (action_key, name, description, acordes_reward, icon, max_per_user) VALUES
('profile_photo', 'Adicionar foto de perfil', 'Complete seu perfil adicionando uma foto', 2, 'Camera', 1),
('refer_friend_purchase', 'Indicar amigo com compra', 'Ganhe acordes quando seu amigo indicado fizer sua primeira compra', 10, 'UserPlus', NULL),
('register_work', 'Registrar obra autoral', 'Ganhe acordes ao registrar uma nova obra', 1, 'FileText', NULL);

-- Função para conceder acordes
CREATE OR REPLACE FUNCTION public.grant_acordes(
  p_user_id UUID,
  p_action_key TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_action acorde_actions%ROWTYPE;
  v_user_action_count INTEGER;
  v_result JSONB;
BEGIN
  -- Buscar ação
  SELECT * INTO v_action
  FROM acorde_actions
  WHERE action_key = p_action_key AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ação não encontrada ou inativa');
  END IF;
  
  -- Verificar limite por usuário
  IF v_action.max_per_user IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_action_count
    FROM acorde_history
    WHERE user_id = p_user_id AND action_id = v_action.id;
    
    IF v_user_action_count >= v_action.max_per_user THEN
      RETURN jsonb_build_object('success', false, 'error', 'Limite de acordes para esta ação já atingido');
    END IF;
  END IF;
  
  -- Criar ou atualizar saldo do usuário
  INSERT INTO user_acordes (user_id, total_acordes)
  VALUES (p_user_id, v_action.acordes_reward)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_acordes = user_acordes.total_acordes + v_action.acordes_reward,
    updated_at = NOW();
  
  -- Registrar histórico
  INSERT INTO acorde_history (user_id, action_id, acordes_earned, reference_id, description)
  VALUES (p_user_id, v_action.id, v_action.acordes_reward, p_reference_id, COALESCE(p_description, v_action.name));
  
  -- Log da atividade
  INSERT INTO user_activity_logs (user_id, action, metadata)
  VALUES (
    p_user_id,
    'acordes_earned',
    jsonb_build_object(
      'action_key', p_action_key,
      'acordes_earned', v_action.acordes_reward,
      'reference_id', p_reference_id
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'acordes_earned', v_action.acordes_reward,
    'action_name', v_action.name
  );
END;
$$;

-- Função para resgatar acordes
CREATE OR REPLACE FUNCTION public.redeem_acordes(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_acordes user_acordes%ROWTYPE;
  v_available_acordes INTEGER;
  v_credits_to_add INTEGER;
BEGIN
  -- Buscar saldo do usuário
  SELECT * INTO v_user_acordes
  FROM user_acordes
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não possui acordes');
  END IF;
  
  -- Calcular acordes disponíveis
  v_available_acordes := v_user_acordes.total_acordes - v_user_acordes.redeemed_acordes;
  
  IF v_available_acordes < 30 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mínimo de 30 acordes necessários para resgate', 'available', v_available_acordes);
  END IF;
  
  -- Calcular créditos (1 acorde = 1 real, e cada crédito custa 30 reais)
  -- Então 30 acordes = 1 crédito
  v_credits_to_add := v_available_acordes / 30;
  
  -- Atualizar acordes resgatados
  UPDATE user_acordes
  SET 
    redeemed_acordes = redeemed_acordes + (v_credits_to_add * 30),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Adicionar créditos ao perfil
  UPDATE profiles
  SET credits = COALESCE(credits, 0) + v_credits_to_add
  WHERE id = p_user_id;
  
  -- Registrar resgate
  INSERT INTO acorde_redemptions (user_id, acordes_redeemed, credits_received)
  VALUES (p_user_id, v_credits_to_add * 30, v_credits_to_add);
  
  -- Log da atividade
  INSERT INTO user_activity_logs (user_id, action, metadata)
  VALUES (
    p_user_id,
    'acordes_redeemed',
    jsonb_build_object(
      'acordes_redeemed', v_credits_to_add * 30,
      'credits_received', v_credits_to_add
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'acordes_redeemed', v_credits_to_add * 30,
    'credits_received', v_credits_to_add,
    'remaining_acordes', v_available_acordes - (v_credits_to_add * 30)
  );
END;
$$;

-- Função para obter progresso do usuário
CREATE OR REPLACE FUNCTION public.get_user_acordes_progress(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_acordes user_acordes%ROWTYPE;
  v_available_acordes INTEGER;
  v_progress_percentage INTEGER;
  v_available_actions JSONB;
  v_recent_history JSONB;
BEGIN
  -- Buscar ou criar saldo do usuário
  INSERT INTO user_acordes (user_id, total_acordes)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO v_user_acordes
  FROM user_acordes
  WHERE user_id = p_user_id;
  
  v_available_acordes := v_user_acordes.total_acordes - v_user_acordes.redeemed_acordes;
  v_progress_percentage := LEAST((v_available_acordes * 100) / 30, 100);
  
  -- Buscar ações disponíveis para o usuário
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'action_key', a.action_key,
      'name', a.name,
      'description', a.description,
      'acordes_reward', a.acordes_reward,
      'icon', a.icon,
      'max_per_user', a.max_per_user,
      'user_completed', COALESCE(h.completed_count, 0),
      'can_complete', CASE 
        WHEN a.max_per_user IS NULL THEN true
        WHEN COALESCE(h.completed_count, 0) < a.max_per_user THEN true
        ELSE false
      END
    )
  ), '[]'::jsonb) INTO v_available_actions
  FROM acorde_actions a
  LEFT JOIN (
    SELECT action_id, COUNT(*) as completed_count
    FROM acorde_history
    WHERE user_id = p_user_id
    GROUP BY action_id
  ) h ON h.action_id = a.id
  WHERE a.is_active = true;
  
  -- Buscar histórico recente
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ah.id,
      'acordes_earned', ah.acordes_earned,
      'description', ah.description,
      'created_at', ah.created_at,
      'action_name', aa.name,
      'action_icon', aa.icon
    ) ORDER BY ah.created_at DESC
  ), '[]'::jsonb) INTO v_recent_history
  FROM acorde_history ah
  JOIN acorde_actions aa ON aa.id = ah.action_id
  WHERE ah.user_id = p_user_id
  LIMIT 10;
  
  RETURN jsonb_build_object(
    'total_acordes', v_user_acordes.total_acordes,
    'redeemed_acordes', v_user_acordes.redeemed_acordes,
    'available_acordes', v_available_acordes,
    'progress_percentage', v_progress_percentage,
    'can_redeem', v_available_acordes >= 30,
    'credits_available', v_available_acordes / 30,
    'acordes_to_next_credit', 30 - (v_available_acordes % 30),
    'available_actions', v_available_actions,
    'recent_history', v_recent_history
  );
END;
$$;

-- Trigger para conceder acordes ao adicionar foto de perfil
CREATE OR REPLACE FUNCTION public.trigger_acordes_profile_photo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se avatar_url foi adicionado/atualizado e antes era nulo ou vazio
  IF (NEW.avatar_url IS NOT NULL AND NEW.avatar_url != '') 
     AND (OLD.avatar_url IS NULL OR OLD.avatar_url = '') THEN
    PERFORM grant_acordes(NEW.id, 'profile_photo', NEW.id, 'Adicionou foto de perfil');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_photo_added
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_acordes_profile_photo();

-- Trigger para conceder acordes ao registrar obra
CREATE OR REPLACE FUNCTION public.trigger_acordes_register_work()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Quando status muda para 'registered' ou 'completed'
  IF NEW.status IN ('registered', 'completed') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('registered', 'completed')) THEN
    PERFORM grant_acordes(NEW.user_id, 'register_work', NEW.id, 'Registrou obra: ' || NEW.title);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_work_registered
  AFTER UPDATE ON public.author_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_acordes_register_work();

-- Criar índices para melhor performance
CREATE INDEX idx_acorde_history_user_id ON public.acorde_history(user_id);
CREATE INDEX idx_acorde_history_action_id ON public.acorde_history(action_id);
CREATE INDEX idx_acorde_redemptions_user_id ON public.acorde_redemptions(user_id);
