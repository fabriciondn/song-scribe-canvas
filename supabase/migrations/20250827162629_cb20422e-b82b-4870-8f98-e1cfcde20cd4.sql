
-- Adicionar função para atualizar dados do moderador
CREATE OR REPLACE FUNCTION public.admin_update_moderator(
  target_moderator_id UUID,
  new_name TEXT,
  new_email TEXT,
  new_credits INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se o usuário atual é super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  -- Verificar se o target é realmente um moderador
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = target_moderator_id 
    AND role = 'moderator'
  ) THEN
    RAISE EXCEPTION 'Target user is not a moderator.';
  END IF;

  -- Atualizar perfil do moderador
  UPDATE public.profiles 
  SET 
    name = new_name,
    email = new_email,
    credits = COALESCE(new_credits, credits)
  WHERE id = target_moderator_id;

  -- Log da atividade
  INSERT INTO public.user_activity_logs (user_id, action, metadata)
  VALUES (
    target_moderator_id, 
    'moderator_updated_by_admin', 
    jsonb_build_object(
      'admin_user_id', auth.uid(),
      'updated_fields', jsonb_build_object(
        'name', new_name,
        'email', new_email,
        'credits', new_credits
      )
    )
  );
END;
$function$

---

-- Adicionar função para excluir moderador
CREATE OR REPLACE FUNCTION public.admin_delete_moderator(
  target_moderator_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se o usuário atual é super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  -- Verificar se o target é realmente um moderador
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = target_moderator_id 
    AND role = 'moderator'
  ) THEN
    RAISE EXCEPTION 'Target user is not a moderator.';
  END IF;

  -- Log da atividade antes de excluir
  INSERT INTO public.user_activity_logs (user_id, action, metadata)
  VALUES (
    target_moderator_id, 
    'moderator_deleted_by_admin', 
    jsonb_build_object(
      'admin_user_id', auth.uid(),
      'deleted_at', NOW()
    )
  );

  -- Remover da tabela admin_users (isso automaticamente remove privilégios)
  DELETE FROM public.admin_users 
  WHERE user_id = target_moderator_id AND role = 'moderator';

  -- Nota: Usuários criados pelo moderador permanecem intactos na tabela moderator_users
  -- para manter histórico de relacionamento
END;
$function$

---

-- Atualizar função de impersonação para incluir logs mais detalhados
CREATE OR REPLACE FUNCTION public.log_impersonation_activity(
  p_impersonated_user_id UUID,
  p_impersonated_role TEXT,
  p_action TEXT DEFAULT 'impersonation_started'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_activity_logs (user_id, action, metadata)
  VALUES (
    p_impersonated_user_id,
    p_action,
    jsonb_build_object(
      'impersonated_by', auth.uid(),
      'impersonated_role', p_impersonated_role,
      'timestamp', NOW()
    )
  );
  
  -- Log também para o usuário que está impersonando
  INSERT INTO public.user_activity_logs (user_id, action, metadata)
  VALUES (
    auth.uid(),
    CASE 
      WHEN p_action = 'impersonation_started' THEN 'started_impersonating'
      ELSE 'stopped_impersonating'
    END,
    jsonb_build_object(
      'target_user_id', p_impersonated_user_id,
      'target_role', p_impersonated_role,
      'timestamp', NOW()
    )
  );
END;
$function$
