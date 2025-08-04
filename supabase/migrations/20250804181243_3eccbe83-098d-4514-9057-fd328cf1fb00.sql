-- Corrigir política RLS para inserção de tokens
DROP POLICY IF EXISTS "Admins can manage moderator registration tokens" ON public.moderator_registration_tokens;

-- Criar políticas separadas para melhor controle
CREATE POLICY "Admins can insert moderator registration tokens" 
ON public.moderator_registration_tokens 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can select moderator registration tokens" 
ON public.moderator_registration_tokens 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update moderator registration tokens" 
ON public.moderator_registration_tokens 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);