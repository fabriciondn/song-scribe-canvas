-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar cron job para limpar certificados temporários a cada hora
SELECT cron.schedule(
  'cleanup-temp-certificates-hourly',
  '0 * * * *', -- A cada hora no minuto 0
  $$
  SELECT
    net.http_post(
        url:='https://hnencfkdsyiwtvktdvzy.supabase.co/functions/v1/cleanup-temp-certificates',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZW5jZmtkc3lpd3R2a3Rkdnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDUyNDUsImV4cCI6MjA2MjIyMTI0NX0.bTZT_trKHsTACQ8rqir304tH89CsiH-XX7Al0ZyIbLw"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);