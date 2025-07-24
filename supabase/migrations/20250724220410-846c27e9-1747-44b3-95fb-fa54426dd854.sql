-- Fix the remaining problematic policy
DROP POLICY IF EXISTS "Super admins can manage admin_users" ON public.admin_users;

-- Create a simple policy for super admins using security definer function
CREATE POLICY "Super admins can manage admin_users" 
ON public.admin_users 
FOR ALL 
USING (public.is_admin_user()) 
WITH CHECK (public.is_admin_user());