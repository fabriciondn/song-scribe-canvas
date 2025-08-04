-- Políticas RLS para moderator_users
CREATE POLICY "Moderators can view their created users" 
ON public.moderator_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'moderator'
  ) 
  AND moderator_id = auth.uid()
);

CREATE POLICY "Moderators can insert their created users" 
ON public.moderator_users 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'moderator'
  ) 
  AND moderator_id = auth.uid()
);

CREATE POLICY "Admins can view all moderator users" 
ON public.moderator_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Trigger para atualizar updated_at na tabela moderator_users
CREATE TRIGGER update_moderator_users_updated_at
  BEFORE UPDATE ON public.moderator_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();