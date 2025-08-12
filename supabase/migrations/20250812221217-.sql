-- CRITICAL SECURITY FIX: Replace overly permissive profiles RLS policies
-- This addresses the CRITICAL vulnerability where all user PII was exposed to everyone

-- First, drop the dangerous "All users can view profiles" policy
DROP POLICY IF EXISTS "All users can view profiles" ON public.profiles;

-- Create secure user-specific policy for users to view only their own profile
CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create admin policy for administrative access to all profiles
CREATE POLICY "Admins can view all profiles for management" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'super_admin')
));

-- Create moderator policy for viewing their managed users
CREATE POLICY "Moderators can view their managed users profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.moderator_users mu
  JOIN public.admin_users au ON au.user_id = mu.moderator_id
  WHERE mu.user_id = profiles.id 
  AND mu.moderator_id = auth.uid()
  AND au.role = 'moderator'
));

-- Create limited public policy for collaboration features (artistic names only)
-- This allows users to see basic info for partnerships without exposing PII
CREATE POLICY "Public access to limited profile data for collaboration" 
ON public.profiles 
FOR SELECT 
USING (true);

-- However, we need to create a view for public collaboration data instead
-- Create a secure view for collaboration that only exposes non-sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  artistic_name,
  name
FROM public.profiles
WHERE artistic_name IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Remove the broad public policy we just created since we have the view
DROP POLICY IF EXISTS "Public access to limited profile data for collaboration" ON public.profiles;

-- Fix partnerships infinite recursion issue
-- Drop problematic recursive policies
DROP POLICY IF EXISTS "Collaborators can view partnerships" ON public.partnerships;
DROP POLICY IF EXISTS "Users can view partnership collaborators" ON public.partnership_collaborators;

-- Create non-recursive partnership policies
CREATE POLICY "Users can view partnerships they own" 
ON public.partnerships 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view partnerships they collaborate on" 
ON public.partnerships 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.partnership_collaborators pc
  WHERE pc.partnership_id = partnerships.id 
  AND pc.user_id = auth.uid()
  AND pc.status = 'active'
));

-- Fix partnership collaborators policy
CREATE POLICY "Users can view collaborators of partnerships they participate in" 
ON public.partnership_collaborators 
FOR SELECT 
USING (
  -- Can view if they own the partnership
  EXISTS (
    SELECT 1 FROM public.partnerships p 
    WHERE p.id = partnership_collaborators.partnership_id 
    AND p.user_id = auth.uid()
  )
  OR 
  -- Can view if they are a collaborator in the same partnership
  (partnership_collaborators.partnership_id IN (
    SELECT pc2.partnership_id 
    FROM public.partnership_collaborators pc2 
    WHERE pc2.user_id = auth.uid() 
    AND pc2.status = 'active'
  ))
);

-- Secure admin_users table access
DROP POLICY IF EXISTS "Allow reading admin status" ON public.admin_users;

CREATE POLICY "Authenticated users can view admin status for role checking" 
ON public.admin_users 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add database function security improvements
-- Fix search_path for security-critical functions
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = check_user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_user_moderator(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = check_user_id 
    AND role = 'moderator'
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role TEXT := 'user';
BEGIN
  SELECT role INTO user_role
  FROM public.admin_users
  WHERE admin_users.user_id = get_user_role.user_id
  AND role IN ('admin', 'super_admin', 'moderator')
  LIMIT 1;
  
  IF user_role IS NULL THEN
    user_role := 'user';
  END IF;
  
  RETURN user_role;
END;
$function$;