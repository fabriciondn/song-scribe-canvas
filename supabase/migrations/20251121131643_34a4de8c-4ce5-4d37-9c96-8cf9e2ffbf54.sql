-- Criar bucket temp-pdfs se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('temp-pdfs', 'temp-pdfs', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de storage para temp-pdfs
CREATE POLICY "Service role can upload temp PDFs"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'temp-pdfs');

CREATE POLICY "Service role can read temp PDFs"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'temp-pdfs');

CREATE POLICY "Service role can delete temp PDFs"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'temp-pdfs');

-- Criar função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.generate_temp_certificate_on_registration()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, extensions
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar se status mudou para 'registered' ou 'registrado'
  IF (NEW.status = 'registered' OR NEW.status = 'registrado') 
     AND (OLD.status IS NULL OR (OLD.status != 'registered' AND OLD.status != 'registrado')) THEN
    
    -- Chamar edge function de forma assíncrona (não bloqueante)
    PERFORM net.http_post(
      url := 'https://hnencfkdsyiwtvktdvzy.supabase.co/functions/v1/generate-temp-certificate',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
      ),
      body := jsonb_build_object('workId', NEW.id)
    );
    
    RAISE NOTICE 'Edge function chamada para gerar PDF do registro: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para chamar a função quando status mudar
DROP TRIGGER IF EXISTS trigger_generate_temp_certificate ON public.author_registrations;

CREATE TRIGGER trigger_generate_temp_certificate
AFTER UPDATE OF status ON public.author_registrations
FOR EACH ROW
EXECUTE FUNCTION public.generate_temp_certificate_on_registration();