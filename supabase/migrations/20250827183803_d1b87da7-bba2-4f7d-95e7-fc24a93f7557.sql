
-- Criar função auxiliar para verificar se um moderador pode agir por um usuário específico
CREATE OR REPLACE FUNCTION public.can_moderator_manage_user(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  -- Verificar se o usuário autenticado é moderador E gerencia o target_user_id
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users au
    JOIN public.moderator_users mu ON au.user_id = mu.moderator_id
    WHERE au.user_id = auth.uid() 
      AND au.role IN ('moderator', 'admin', 'super_admin')
      AND mu.user_id = target_user_id
  );
$$;

-- Atualizar política INSERT para suportar moderadores
DROP POLICY IF EXISTS "Users can create their own author registrations" ON public.author_registrations;

CREATE POLICY "Users can create their own author registrations or moderators can create for managed users" 
ON public.author_registrations
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR public.can_moderator_manage_user(user_id)
);

-- Atualizar política SELECT para suportar moderadores  
DROP POLICY IF EXISTS "Users can view their own author registrations" ON public.author_registrations;

CREATE POLICY "Users can view their own author registrations or moderators can view managed users" 
ON public.author_registrations
FOR SELECT 
USING (
  auth.uid() = user_id OR public.can_moderator_manage_user(user_id)
);

-- Atualizar política UPDATE para suportar moderadores
DROP POLICY IF EXISTS "Users can update their own author registrations" ON public.author_registrations;

CREATE POLICY "Users can update their own author registrations or moderators can update managed users" 
ON public.author_registrations
FOR UPDATE 
USING (
  auth.uid() = user_id OR public.can_moderator_manage_user(user_id)
);

-- Atualizar política DELETE para suportar moderadores  
DROP POLICY IF EXISTS "Users can delete their own author registrations" ON public.author_registrations;

CREATE POLICY "Users can delete their own author registrations or moderators can delete managed users" 
ON public.author_registrations
FOR DELETE 
USING (
  auth.uid() = user_id OR public.can_moderator_manage_user(user_id)
);
