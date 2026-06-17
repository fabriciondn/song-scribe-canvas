
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id
      AND role = ANY (ARRAY['admin','super_admin'])
  )
$$;

DROP POLICY IF EXISTS "Admins can view all admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can delete admin users" ON public.admin_users;

CREATE POLICY "Admins can view all admin_users"
ON public.admin_users FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete admin users"
ON public.admin_users FOR DELETE
TO authenticated
USING (public.is_admin_user(auth.uid()));
