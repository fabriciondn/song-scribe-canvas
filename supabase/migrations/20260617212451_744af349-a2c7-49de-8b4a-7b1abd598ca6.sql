CREATE POLICY "Admins can view all admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.role IN ('admin','super_admin')
  )
);