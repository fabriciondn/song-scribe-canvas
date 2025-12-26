-- Remover política antiga
DROP POLICY IF EXISTS "Admins can view all moderator users" ON moderator_users;

-- Criar nova política que inclui super_admin
CREATE POLICY "Admins can view all moderator users" 
ON moderator_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.role IN ('admin', 'super_admin')
  )
);