-- Criar bucket temp-pdfs se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-pdfs',
  'temp-pdfs',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Políticas de acesso para temp-pdfs
CREATE POLICY "Permitir leitura pública de PDFs temporários"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp-pdfs');

CREATE POLICY "Permitir upload de PDFs pela função"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'temp-pdfs');

CREATE POLICY "Permitir atualização de PDFs pela função"
ON storage.objects FOR UPDATE
USING (bucket_id = 'temp-pdfs');

CREATE POLICY "Permitir exclusão de PDFs pela função"
ON storage.objects FOR DELETE
USING (bucket_id = 'temp-pdfs');