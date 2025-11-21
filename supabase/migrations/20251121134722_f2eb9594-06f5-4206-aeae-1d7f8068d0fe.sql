
-- Adicionar logging detalhado ao trigger
CREATE OR REPLACE FUNCTION public.generate_temp_certificate_on_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url text;
  request_id int;
BEGIN
  -- Log início
  RAISE LOG 'Trigger iniciado para registro ID: %', NEW.id;
  
  -- Verificar se a mudança é para 'registered'
  IF NEW.status = 'registered' AND (OLD.status IS NULL OR OLD.status != 'registered') THEN
    RAISE LOG 'Status mudou para registered, preparando chamada da edge function';
    
    -- URL da edge function
    function_url := 'https://hnencfkdsyiwtvktdvzy.supabase.co/functions/v1/generate-temp-certificate';
    
    RAISE LOG 'URL da função: %', function_url;
    
    -- Fazer requisição HTTP via extensão http
    BEGIN
      SELECT status INTO request_id
      FROM extensions.http_post(
        function_url,
        json_build_object('workId', NEW.id)::text,
        'application/json',
        ARRAY[
          extensions.http_header('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZW5jZmtkc3lpd3R2a3Rkdnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDUyNDUsImV4cCI6MjA2MjIyMTI0NX0.bTZT_trKHsTACQ8rqir304tH89CsiH-XX7Al0ZyIbLw'),
          extensions.http_header('Content-Type', 'application/json')
        ]
      );
      
      RAISE LOG 'Requisição HTTP executada com status: %', request_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Erro ao chamar edge function: % %', SQLERRM, SQLSTATE;
    END;
  ELSE
    RAISE LOG 'Status não mudou para registered (atual: %, anterior: %)', NEW.status, OLD.status;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_generate_temp_certificate ON public.author_registrations;

CREATE TRIGGER trigger_generate_temp_certificate
  AFTER UPDATE ON public.author_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_temp_certificate_on_registration();
