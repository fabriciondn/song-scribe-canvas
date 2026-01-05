-- Atualizar função para permitir que admins gerenciem qualquer usuário
CREATE OR REPLACE FUNCTION public.can_moderator_manage_user(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    -- Caso 1: Admins/Super Admins podem gerenciar QUALQUER usuário
    EXISTS (
      SELECT 1 
      FROM public.admin_users au
      WHERE au.user_id = auth.uid() 
        AND au.role IN ('admin', 'super_admin')
    )
    OR
    -- Caso 2: Moderadores só podem gerenciar usuários vinculados a eles
    EXISTS (
      SELECT 1 
      FROM public.admin_users au
      JOIN public.moderator_users mu ON au.user_id = mu.moderator_id
      WHERE au.user_id = auth.uid() 
        AND au.role = 'moderator'
        AND mu.user_id = target_user_id
    );
$$;