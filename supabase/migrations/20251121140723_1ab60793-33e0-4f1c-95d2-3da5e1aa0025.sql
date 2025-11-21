-- Habilitar extensão pg_net para chamadas HTTP
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Função corrigida para chamar a edge function usando pg_net
CREATE OR REPLACE FUNCTION public.call_generate_temp_certificate(work_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url TEXT := 'https://hnencfkdsyiwtvktdvzy.supabase.co/functions/v1/generate-temp-certificate';
  request_id BIGINT;
BEGIN
  RAISE NOTICE 'Chamando edge function para workId: %', work_id;
  
  -- Fazer requisição HTTP POST usando pg_net
  SELECT net.http_post(
    url := function_url,
    body := json_build_object('workId', work_id)::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    )
  ) INTO request_id;
  
  RAISE NOTICE 'Edge function chamada com sucesso. Request ID: %', request_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao chamar edge function: %', SQLERRM;
END;
$$;