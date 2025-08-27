
-- Remover políticas RLS antigas e conflitantes do bucket author-registrations
DROP POLICY IF EXISTS "Users can upload their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload author registration files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own author registration files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own author registration files" ON storage.objects;

-- Atualizar configuração do bucket author-registrations
UPDATE storage.buckets 
SET 
  file_size_limit = 52428800,  -- 50MB
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/flac', 'audio/x-m4a']
WHERE id = 'author-registrations';

-- Criar políticas RLS simples e funcionais
CREATE POLICY "Allow authenticated uploads to author-registrations" ON storage.objects
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'author-registrations');

CREATE POLICY "Allow users to view their own author registration files" ON storage.objects
FOR SELECT 
TO authenticated 
USING (bucket_id = 'author-registrations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own author registration files" ON storage.objects
FOR DELETE 
TO authenticated 
USING (bucket_id = 'author-registrations' AND auth.uid()::text = (storage.foldername(name))[1]);
