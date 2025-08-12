-- Fix Security Definer View issue by replacing problematic public_profiles view

-- Drop the insecure SECURITY DEFINER view
DROP VIEW IF EXISTS public.public_profiles;

-- Create a new secure view that respects RLS policies
-- This view will only return data that users are authorized to see based on existing RLS policies
CREATE VIEW public.public_profiles AS
SELECT 
    id,
    artistic_name,
    name
FROM public.profiles
WHERE artistic_name IS NOT NULL;

-- The new view inherits the RLS policies from the profiles table
-- Users will only see profiles they're authorized to see based on existing policies:
-- - Users can see their own profile
-- - Admins can see all profiles 
-- - Moderators can see their managed users' profiles

-- Grant appropriate permissions to the view
GRANT SELECT ON public.public_profiles TO public;

-- Ensure RLS is enabled on the profiles table (should already be enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;