-- Fix infinite recursion in admin_users policies by creating a security definer function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Only super admins can manage admin users" ON public.admin_users;

-- Create new policies using the security definer function
CREATE POLICY "Admins can view admin_users" 
ON public.admin_users 
FOR SELECT 
USING (public.is_admin_user());

CREATE POLICY "Super admins can manage admin_users" 
ON public.admin_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() AND au.role = 'super_admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() AND au.role = 'super_admin'
  )
);

-- Also create a simpler function to check admin access
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
$$;