-- Fix security warnings by adding SET search_path = 'public' to functions
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.user_sessions 
  WHERE last_activity < NOW() - INTERVAL '1 hour';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
  total_users INTEGER;
  total_songs INTEGER;
  total_drafts INTEGER;
  total_partnerships INTEGER;
  total_registered_works INTEGER;
  active_users INTEGER;
  total_templates INTEGER;
  total_folders INTEGER;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Get total users
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  
  -- Get total songs
  SELECT COUNT(*) INTO total_songs FROM public.songs WHERE deleted_at IS NULL;
  
  -- Get total drafts
  SELECT COUNT(*) INTO total_drafts FROM public.drafts WHERE deleted_at IS NULL;
  
  -- Get total partnerships
  SELECT COUNT(*) INTO total_partnerships FROM public.partnerships;
  
  -- Get total registered works
  SELECT COUNT(*) INTO total_registered_works FROM public.author_registrations;
  
  -- Get active users (last 24 hours)
  SELECT COUNT(DISTINCT user_id) INTO active_users 
  FROM public.user_sessions 
  WHERE last_activity > NOW() - INTERVAL '24 hours';
  
  -- Get total templates
  SELECT COUNT(*) INTO total_templates FROM public.templates WHERE deleted_at IS NULL;
  
  -- Get total folders
  SELECT COUNT(*) INTO total_folders FROM public.folders WHERE deleted_at IS NULL;

  result := jsonb_build_object(
    'total_users', total_users,
    'total_songs', total_songs,
    'total_drafts', total_drafts,
    'total_partnerships', total_partnerships,
    'total_registered_works', total_registered_works,
    'active_users', active_users,
    'total_templates', total_templates,
    'total_folders', total_folders
  );

  RETURN result;
END;
$$;