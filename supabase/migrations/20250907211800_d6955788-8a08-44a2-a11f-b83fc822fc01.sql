-- Criar edge function para auto-trial em novos usuários
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir subscription de trial de 15 dias para novos usuários
  INSERT INTO public.subscriptions (
    user_id,
    status,
    plan_type,
    started_at,
    expires_at,
    auto_renew,
    currency
  ) VALUES (
    NEW.id,
    'trial',
    'trial',
    NOW(),
    NOW() + INTERVAL '15 days',
    false,
    'BRL'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para auto-trial
CREATE TRIGGER auto_trial_on_user_create
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_trial_subscription();

-- Função para verificar se subscription expirou
CREATE OR REPLACE FUNCTION public.check_subscription_expiry(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_record subscriptions%ROWTYPE;
BEGIN
  -- Buscar subscription ativa/trial mais recente
  SELECT * INTO subscription_record
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trial')
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Se não tem subscription, retorna false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Se tem expires_at e já expirou
  IF subscription_record.expires_at IS NOT NULL 
     AND subscription_record.expires_at < NOW() THEN
    
    -- Marcar como expirada
    UPDATE public.subscriptions
    SET status = 'expired',
        updated_at = NOW()
    WHERE id = subscription_record.id;
    
    RETURN FALSE;
  END IF;
  
  -- Se chegou até aqui, subscription está válida
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;