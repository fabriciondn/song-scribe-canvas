-- Corrigir função do trigger removendo tentativa de acessar header inexistente
CREATE OR REPLACE FUNCTION public.generate_temp_certificate_on_registration()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar se status mudou para 'registered' ou 'registrado'
  IF (NEW.status = 'registered' OR NEW.status = 'registrado') 
     AND (OLD.status IS NULL OR (OLD.status != 'registered' AND OLD.status != 'registrado')) THEN
    
    -- Chamar edge function de forma assíncrona (não bloqueante)
    -- Usar apenas o anon key pois a edge function usa service role internamente
    PERFORM net.http_post(
      url := 'https://hnencfkdsyiwtvktdvzy.supabase.co/functions/v1/generate-temp-certificate',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZW5jZmtkc3lpd3R2a3Rkdnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDUyNDUsImV4cCI6MjA2MjIyMTI0NX0.bTZT_trKHsTACQ8rqir304tH89CsiH-XX7Al0ZyIbLw'
      ),
      body := jsonb_build_object('workId', NEW.id)
    );
    
    RAISE NOTICE 'Edge function chamada para gerar PDF do registro: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;