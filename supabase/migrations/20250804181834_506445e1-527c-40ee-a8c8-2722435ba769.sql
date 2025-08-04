-- Corrigir política RLS para aceitar tanto admin quanto super_admin
DROP POLICY IF EXISTS "Admins can insert moderator registration tokens" ON public.moderator_registration_tokens;
DROP POLICY IF EXISTS "Admins can select moderator registration tokens" ON public.moderator_registration_tokens;
DROP POLICY IF EXISTS "Admins can update moderator registration tokens" ON public.moderator_registration_tokens;

-- Criar políticas que aceitem admin ou super_admin
CREATE POLICY "Admins can insert moderator registration tokens" 
ON public.moderator_registration_tokens 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can select moderator registration tokens" 
ON public.moderator_registration_tokens 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update moderator registration tokens" 
ON public.moderator_registration_tokens 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);