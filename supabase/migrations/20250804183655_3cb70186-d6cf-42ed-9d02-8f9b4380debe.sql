-- Criar função para registrar moderador com token
CREATE OR REPLACE FUNCTION public.register_moderator_with_token(
  p_token text,
  p_user_id uuid,
  p_name text,
  p_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  token_record moderator_registration_tokens%ROWTYPE;
BEGIN
  -- Verificar se o token é válido
  SELECT * INTO token_record
  FROM public.moderator_registration_tokens
  WHERE token = p_token
    AND used = false
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token inválido ou expirado';
  END IF;
  
  -- Criar ou atualizar perfil do usuário
  INSERT INTO public.profiles (id, name, email, credits)
  VALUES (p_user_id, p_name, p_email, 100) -- Dar 100 créditos iniciais para moderadores
  ON CONFLICT (id) 
  DO UPDATE SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email;
  
  -- Adicionar usuário como moderador
  INSERT INTO public.admin_users (user_id, role, permissions)
  VALUES (p_user_id, 'moderator', '["manage_user_credits", "create_users"]')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();
  
  -- Marcar token como usado
  UPDATE public.moderator_registration_tokens
  SET 
    used = true,
    used_by = p_user_id,
    used_at = NOW(),
    updated_at = NOW()
  WHERE token = p_token;
  
  -- Log da atividade
  INSERT INTO public.user_activity_logs (user_id, action, metadata)
  VALUES (
    p_user_id, 
    'moderator_registration_completed', 
    jsonb_build_object(
      'token_used', p_token,
      'registered_at', NOW()
    )
  );
  
  RETURN true;
END;
$$;

-- Permitir que usuários autenticados usem esta função
GRANT EXECUTE ON FUNCTION public.register_moderator_with_token TO authenticated;

-- Criar função para verificar se usuário é moderador ou admin
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.admin_users WHERE admin_users.user_id = $1),
    'user'
  );
$$;