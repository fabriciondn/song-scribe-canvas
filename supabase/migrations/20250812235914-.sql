-- CRITICAL SECURITY FIX: Secure public_registration_forms table
-- This table contains extremely sensitive PII and currently allows unrestricted access

-- First, let's audit current data exposure
CREATE OR REPLACE FUNCTION audit_registration_submissions()
RETURNS TABLE(
  submission_count BIGINT,
  unique_ips BIGINT, 
  suspicious_patterns TEXT[]
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This would help identify if there's been any malicious activity
  RETURN QUERY
  SELECT 
    COUNT(*) as submission_count,
    0::BIGINT as unique_ips,  -- Placeholder since we don't track IPs yet
    ARRAY[]::TEXT[] as suspicious_patterns;
END;
$$;

-- Create a rate limiting table to prevent spam/abuse
CREATE TABLE IF NOT EXISTS public.registration_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET,
  email TEXT,
  submission_count INTEGER DEFAULT 1,
  first_submission TIMESTAMPTZ DEFAULT NOW(),
  last_submission TIMESTAMPTZ DEFAULT NOW(),
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on rate limiting table
ALTER TABLE public.registration_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only admins can manage rate limiting
CREATE POLICY "Admins can manage rate limits" 
ON public.registration_rate_limits
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid()
));

-- Create secure registration function with rate limiting and validation
CREATE OR REPLACE FUNCTION public.secure_public_registration(
  p_artistic_name TEXT DEFAULT NULL,
  p_email TEXT,
  p_full_name TEXT,
  p_cpf TEXT,
  p_birth_date DATE,
  p_cep TEXT,
  p_street TEXT,
  p_number TEXT,
  p_neighborhood TEXT,
  p_city TEXT,
  p_state TEXT,
  p_client_ip INET DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rate_limit_record public.registration_rate_limits%ROWTYPE;
  registration_id UUID;
  result JSON;
BEGIN
  -- Input validation
  IF p_email IS NULL OR p_email = '' THEN
    RETURN json_build_object('success', false, 'error', 'Email is required');
  END IF;
  
  IF p_cpf IS NULL OR LENGTH(p_cpf) < 11 THEN
    RETURN json_build_object('success', false, 'error', 'Valid CPF is required');
  END IF;
  
  -- Check for duplicate email submissions
  IF EXISTS (
    SELECT 1 FROM public.public_registration_forms 
    WHERE email = p_email
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Email already registered');
  END IF;
  
  -- Check for duplicate CPF submissions (major security concern)
  IF EXISTS (
    SELECT 1 FROM public.public_registration_forms 
    WHERE cpf = p_cpf
  ) THEN
    RETURN json_build_object('success', false, 'error', 'CPF already registered');
  END IF;
  
  -- Rate limiting by email (5 submissions max)
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
    
    -- Update rate limit counter
    UPDATE public.registration_rate_limits
    SET 
      submission_count = submission_count + 1,
      last_submission = NOW()
    WHERE email = p_email;
  ELSE
    -- Create new rate limit record
    INSERT INTO public.registration_rate_limits (email, ip_address)
    VALUES (p_email, p_client_ip);
  END IF;
  
  -- Insert the registration data
  INSERT INTO public.public_registration_forms (
    artistic_name, email, full_name, cpf, birth_date,
    cep, street, number, neighborhood, city, state
  ) VALUES (
    p_artistic_name, p_email, p_full_name, p_cpf, p_birth_date,
    p_cep, p_street, p_number, p_neighborhood, p_city, p_state
  ) RETURNING id INTO registration_id;
  
  -- Log the successful registration for audit
  INSERT INTO public.user_activity_logs (user_id, action, metadata, ip_address)
  VALUES (
    NULL, -- No user ID for public registrations
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
    -- Log the error for security monitoring
    INSERT INTO public.user_activity_logs (user_id, action, metadata)
    VALUES (
      NULL,
      'public_registration_error',
      json_build_object('error', SQLERRM, 'email', p_email)
    );
    
    RETURN json_build_object('success', false, 'error', 'Registration failed');
END;
$$;

-- REMOVE the insecure "Anyone can insert" policy
DROP POLICY IF EXISTS "Anyone can insert public registration forms" ON public.public_registration_forms;

-- Add secure policies that prevent direct table access
CREATE POLICY "No direct inserts allowed" 
ON public.public_registration_forms
FOR INSERT
WITH CHECK (false); -- Block all direct inserts

CREATE POLICY "No direct updates allowed" 
ON public.public_registration_forms  
FOR UPDATE
USING (false); -- Block all direct updates

-- Keep the admin access policy
-- (The existing "Admins can view all public registration forms" policy remains)

-- Grant execute permission on the secure function to public
GRANT EXECUTE ON FUNCTION public.secure_public_registration TO public;
GRANT EXECUTE ON FUNCTION audit_registration_submissions TO public;

-- Create index for better performance on lookups
CREATE INDEX IF NOT EXISTS idx_public_registration_email ON public.public_registration_forms(email);
CREATE INDEX IF NOT EXISTS idx_public_registration_cpf ON public.public_registration_forms(cpf);
CREATE INDEX IF NOT EXISTS idx_rate_limits_email ON public.registration_rate_limits(email);