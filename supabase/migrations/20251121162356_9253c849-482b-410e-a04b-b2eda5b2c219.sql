-- Criar bucket para assets de certificados (imagens PNG permanentes)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('certificate-assets', 'certificate-assets', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir leitura pública dos assets
CREATE POLICY "Public read access for certificate assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificate-assets');

-- Política para permitir service_role fazer upload dos assets
CREATE POLICY "Service role can upload certificate assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificate-assets' AND auth.role() = 'service_role');