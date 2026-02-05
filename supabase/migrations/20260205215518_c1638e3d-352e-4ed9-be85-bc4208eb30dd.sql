-- Atualizar bucket para permitir arquivos até 200MB e tipos de vídeo específicos
UPDATE storage.buckets
SET 
  file_size_limit = 209715200, -- 200MB em bytes
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-m4v']
WHERE id = 'offer-videos';