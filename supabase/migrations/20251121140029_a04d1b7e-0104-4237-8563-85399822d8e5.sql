-- Criar bucket temp-pdfs se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-pdfs',
  'temp-pdfs',
  true,
  5242880, -- 5MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de storage para temp-pdfs
CREATE POLICY "Public can view temp PDFs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'temp-pdfs');

CREATE POLICY "Authenticated users can upload temp PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'temp-pdfs');

CREATE POLICY "Service role can manage temp PDFs"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'temp-pdfs');

-- Habilitar extensão HTTP para chamadas de edge functions
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Função para chamar a edge function e gerar PDF temporário
CREATE OR REPLACE FUNCTION public.call_generate_temp_certificate(work_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  response TEXT;
BEGIN
  -- Construir URL da edge function
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/generate-temp-certificate';
  service_role_key := current_setting('app.settings.supabase_service_role_key', true);
  
  -- Se as configurações não existirem, usar valores padrão
  IF function_url IS NULL OR function_url = '/functions/v1/generate-temp-certificate' THEN
    function_url := 'https://hnencfkdsyiwtvktdvzy.supabase.co/functions/v1/generate-temp-certificate';
  END IF;
  
  RAISE NOTICE 'Chamando edge function para workId: %', work_id;
  
  -- Fazer requisição HTTP POST assíncrona
  PERFORM extensions.http_post(
    url := function_url,
    body := json_build_object('workId', work_id)::text,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    )::jsonb
  );
  
  RAISE NOTICE 'Edge function chamada com sucesso';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao chamar edge function: %', SQLERRM;
END;
$$;

-- Trigger function que será executada quando status mudar para 'registered'
CREATE OR REPLACE FUNCTION public.trigger_generate_temp_certificate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas executar quando o status muda para 'registered'
  IF NEW.status = 'registered' AND (OLD.status IS NULL OR OLD.status != 'registered') THEN
    RAISE NOTICE 'Status mudou para registered, chamando geração de PDF para work_id: %', NEW.id;
    
    -- Chamar função que invoca edge function (de forma assíncrona)
    PERFORM public.call_generate_temp_certificate(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_generate_temp_certificate ON public.author_registrations;

-- Criar novo trigger
CREATE TRIGGER trigger_generate_temp_certificate
AFTER INSERT OR UPDATE OF status ON public.author_registrations
FOR EACH ROW
EXECUTE FUNCTION public.trigger_generate_temp_certificate();