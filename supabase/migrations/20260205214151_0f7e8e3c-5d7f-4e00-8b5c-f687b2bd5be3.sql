-- Criar bucket público para vídeos da página de oferta
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-videos', 'offer-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso - leitura pública
CREATE POLICY "Offer videos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'offer-videos');

-- Políticas de upload - apenas admins autenticados
CREATE POLICY "Only admins can upload offer videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'offer-videos' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Políticas de delete - apenas admins
CREATE POLICY "Only admins can delete offer videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'offer-videos' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Adicionar setting para URL do vídeo
INSERT INTO public.offer_page_settings (setting_key, setting_value)
VALUES ('video_url', NULL)
ON CONFLICT (setting_key) DO NOTHING;