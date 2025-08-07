-- Manually update stuck registrations to "registered" status
UPDATE public.author_registrations 
SET 
  status = 'registered',
  analysis_completed_at = NOW(),
  updated_at = NOW()
WHERE status = 'em análise' 
  AND created_at < NOW() - INTERVAL '1 hour';

-- Enable realtime updates for author_registrations table
ALTER TABLE public.author_registrations REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.author_registrations;

-- Create edge function to process pending registrations
CREATE OR REPLACE FUNCTION public.process_pending_registrations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update registrations that have been in analysis for more than 5 minutes
  UPDATE public.author_registrations 
  SET 
    status = 'registered',
    analysis_completed_at = NOW(),
    updated_at = NOW()
  WHERE status = 'em análise' 
    AND analysis_started_at IS NOT NULL
    AND analysis_started_at < NOW() - INTERVAL '5 minutes';
    
  -- Update registrations that don't have analysis_started_at but are old
  UPDATE public.author_registrations 
  SET 
    status = 'registered',
    analysis_started_at = NOW(),
    analysis_completed_at = NOW(),
    updated_at = NOW()
  WHERE status = 'em análise' 
    AND analysis_started_at IS NULL
    AND created_at < NOW() - INTERVAL '5 minutes';
END;
$function$;