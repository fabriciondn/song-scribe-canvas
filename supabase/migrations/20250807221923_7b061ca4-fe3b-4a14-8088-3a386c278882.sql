-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para processar registros pendentes a cada minuto
SELECT cron.schedule(
  'process-author-registrations',
  '* * * * *', -- A cada minuto
  $$
  SELECT
    net.http_post(
        url:='https://hnencfkdsyiwtvktdvzy.supabase.co/functions/v1/process-registrations',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZW5jZmtkc3lpd3R2a3Rkdnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDUyNDUsImV4cCI6MjA2MjIyMTI0NX0.bTZT_trKHsTACQ8rqir304tH89CsiH-XX7Al0ZyIbLw"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Atualizar função para processar registros com tempo aleatório mais realista
CREATE OR REPLACE FUNCTION public.process_pending_registrations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update registrations que estão em análise há mais de 1-5 minutos (tempo aleatório)
  UPDATE public.author_registrations 
  SET 
    status = 'registered',
    analysis_completed_at = NOW(),
    updated_at = NOW()
  WHERE status = 'em análise' 
    AND analysis_started_at IS NOT NULL
    AND analysis_started_at < NOW() - INTERVAL '1 minute' * (1 + random() * 4); -- 1-5 minutos aleatório
    
  -- Update registrations que não têm analysis_started_at mas são antigas
  UPDATE public.author_registrations 
  SET 
    status = 'registered',
    analysis_started_at = NOW(),
    analysis_completed_at = NOW(),
    updated_at = NOW()
  WHERE status = 'em análise' 
    AND analysis_started_at IS NULL
    AND created_at < NOW() - INTERVAL '1 minute';
END;
$function$;