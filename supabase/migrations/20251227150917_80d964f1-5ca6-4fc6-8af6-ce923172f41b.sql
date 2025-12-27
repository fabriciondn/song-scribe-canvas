
-- Adicionar política para admins poderem deletar registros de admin_users
CREATE POLICY "Admins can delete admin users"
ON public.admin_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid()
    AND au.role IN ('admin', 'super_admin')
  )
);

-- Deletar o moderador Felipe Nedino
DELETE FROM public.admin_users WHERE user_id = '4f1d4657-c2ba-4f38-80a0-5ef54640038c';
