-- Fix the admin access check function to handle authentication properly
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- First check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user exists in admin_users table
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return false for any errors
    RETURN false;
END;
$function$;