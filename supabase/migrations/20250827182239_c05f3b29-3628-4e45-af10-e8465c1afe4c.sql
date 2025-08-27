
-- Criar o bucket author-registrations se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'author-registrations', 
  'author-registrations', 
  true, 
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/flac']
)
ON CONFLICT (id) DO NOTHING;

-- Criar política RLS para permitir que usuários autenticados façam upload
CREATE POLICY "Authenticated users can upload author registration files" ON storage.objects
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'author-registrations');

-- Criar política RLS para permitir que usuários vejam seus próprios arquivos
CREATE POLICY "Users can view their own author registration files" ON storage.objects
FOR SELECT 
TO authenticated 
USING (bucket_id = 'author-registrations' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Criar política RLS para permitir que usuários deletem seus próprios arquivos
CREATE POLICY "Users can delete their own author registration files" ON storage.objects
FOR DELETE 
TO authenticated 
USING (bucket_id = 'author-registrations' AND auth.uid()::text = (storage.foldername(name))[1]);
