-- Adicionar campo telefone na tabela public_registration_forms
ALTER TABLE public.public_registration_forms 
ADD COLUMN phone TEXT;

-- Atualizar a função secure_public_registration para incluir telefone
CREATE OR REPLACE FUNCTION public.secure_public_registration(
  p_email text, 
  p_full_name text, 
  p_cpf text, 
  p_birth_date date, 
  p_cep text, 
  p_street text, 
  p_number text, 
  p_neighborhood text, 
  p_city text, 
  p_state text, 
  p_phone text DEFAULT NULL,
  p_artistic_name text DEFAULT NULL, 
  p_client_ip inet DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rate_limit_record public.registration_rate_limits%ROWTYPE;
  registration_id UUID;
BEGIN
  -- Input validation
  IF p_email IS NULL OR p_email = '' THEN
    RETURN json_build_object('success', false, 'error', 'Email is required');
  END IF;
  
  IF p_cpf IS NULL OR LENGTH(p_cpf) < 11 THEN
    RETURN json_build_object('success', false, 'error', 'Valid CPF is required');
  END IF;
  
  IF p_phone IS NULL OR p_phone = '' THEN
    RETURN json_build_object('success', false, 'error', 'Phone is required');
  END IF;
  
  -- Check for duplicate email submissions
  IF EXISTS (
    SELECT 1 FROM public.public_registration_forms 
    WHERE email = p_email
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Email already registered');
  END IF;
  
  -- Check for duplicate CPF submissions
  IF EXISTS (
    SELECT 1 FROM public.public_registration_forms 
    WHERE cpf = p_cpf
  ) THEN
    RETURN json_build_object('success', false, 'error', 'CPF already registered');
  END IF;
  
  -- Rate limiting by email
  SELECT * INTO rate_limit_record
  FROM public.registration_rate_limits
  WHERE email = p_email;
  
  IF FOUND THEN
    IF rate_limit_record.is_blocked THEN
      RETURN json_build_object('success', false, 'error', 'Email blocked due to suspicious activity');
    END IF;
    
    IF rate_limit_record.submission_count >= 5 THEN
      UPDATE public.registration_rate_limits 
      SET is_blocked = true 
      WHERE email = p_email;
      RETURN json_build_object('success', false, 'error', 'Too many submission attempts');
    END IF;
    
    UPDATE public.registration_rate_limits
    SET 
      submission_count = submission_count + 1,
      last_submission = NOW()
    WHERE email = p_email;
  ELSE
    INSERT INTO public.registration_rate_limits (email, ip_address)
    VALUES (p_email, p_client_ip);
  END IF;
  
  -- Insert the registration data
  INSERT INTO public.public_registration_forms (
    artistic_name, email, full_name, cpf, birth_date,
    cep, street, number, neighborhood, city, state, phone
  ) VALUES (
    p_artistic_name, p_email, p_full_name, p_cpf, p_birth_date,
    p_cep, p_street, p_number, p_neighborhood, p_city, p_state, p_phone
  ) RETURNING id INTO registration_id;
  
  -- Log the successful registration
  INSERT INTO public.user_activity_logs (user_id, action, metadata, ip_address)
  VALUES (
    NULL,
    'public_registration_submitted',
    json_build_object(
      'registration_id', registration_id,
      'email', p_email,
      'has_artistic_name', (p_artistic_name IS NOT NULL AND p_artistic_name != '')
    ),
    p_client_ip::TEXT
  );
  
  RETURN json_build_object(
    'success', true, 
    'registration_id', registration_id,
    'message', 'Registration submitted successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO public.user_activity_logs (user_id, action, metadata)
    VALUES (
      NULL,
      'public_registration_error',
      json_build_object('error', SQLERRM, 'email', p_email)
    );
    
    RETURN json_build_object('success', false, 'error', 'Registration failed');
END;
$function$;

-- Adicionar campo is_hidden na tabela menu_functions
ALTER TABLE public.menu_functions 
ADD COLUMN is_hidden BOOLEAN DEFAULT false;

-- Atualizar função get_admin_dashboard_stats para retornar dados reais
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  online_users INTEGER;
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
  
  -- Get total songs (not deleted)
  SELECT COUNT(*) INTO total_songs FROM public.songs WHERE deleted_at IS NULL;
  
  -- Get total drafts (not deleted)
  SELECT COUNT(*) INTO total_drafts FROM public.drafts WHERE deleted_at IS NULL;
  
  -- Get total partnerships
  SELECT COUNT(*) INTO total_partnerships FROM public.partnerships;
  
  -- Get total registered works
  SELECT COUNT(*) INTO total_registered_works FROM public.author_registrations;
  
  -- Get active users (last 24 hours)
  SELECT COUNT(DISTINCT user_id) INTO active_users 
  FROM public.user_sessions 
  WHERE last_activity > NOW() - INTERVAL '24 hours';
  
  -- Get online users (last 5 minutes)
  SELECT COUNT(DISTINCT user_id) INTO online_users 
  FROM public.user_sessions 
  WHERE is_active = true 
  AND last_activity > NOW() - INTERVAL '5 minutes';
  
  -- Get total templates (not deleted)
  SELECT COUNT(*) INTO total_templates FROM public.templates WHERE deleted_at IS NULL;
  
  -- Get total folders (not deleted)
  SELECT COUNT(*) INTO total_folders FROM public.folders WHERE deleted_at IS NULL;

  result := jsonb_build_object(
    'total_users', total_users,
    'total_songs', total_songs,
    'total_drafts', total_drafts,
    'total_partnerships', total_partnerships,
    'total_registered_works', total_registered_works,
    'active_users', active_users,
    'online_users', online_users,
    'total_templates', total_templates,
    'total_folders', total_folders
  );

  RETURN result;
END;
$function$;

-- Função para buscar usuários online
CREATE OR REPLACE FUNCTION public.get_online_users()
RETURNS TABLE (
  user_id uuid,
  name text,
  email text,
  avatar_url text,
  last_activity timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    us.user_id,
    p.name,
    p.email,
    p.avatar_url,
    us.last_activity
  FROM public.user_sessions us
  JOIN public.profiles p ON p.id = us.user_id
  WHERE us.is_active = true 
    AND us.last_activity > NOW() - INTERVAL '5 minutes'
  ORDER BY us.last_activity DESC;
END;
$function$;