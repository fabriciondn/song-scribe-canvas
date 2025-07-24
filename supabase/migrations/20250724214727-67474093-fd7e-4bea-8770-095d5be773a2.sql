-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users - only super admins can manage admin users
CREATE POLICY "Only super admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() AND au.role = 'super_admin'
  )
);

-- Create certificate templates table
CREATE TABLE public.certificate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  design_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on certificate_templates
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for certificate templates - only admins can manage
CREATE POLICY "Only admins can manage certificate templates" 
ON public.certificate_templates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Create user sessions table for tracking online users
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for user sessions - users can only see their own sessions, admins can see all
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" 
ON public.user_sessions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to clean old sessions (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.user_sessions 
  WHERE last_activity < NOW() - INTERVAL '1 hour';
END;
$$;

-- Create function to get admin dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON public.certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a super admin user (you'll need to replace with actual user ID)
-- This is just an example - you'll need to set this up manually for the first admin
INSERT INTO public.admin_users (user_id, role) 
VALUES ('00000000-0000-0000-0000-000000000000', 'super_admin')
ON CONFLICT (user_id) DO NOTHING;