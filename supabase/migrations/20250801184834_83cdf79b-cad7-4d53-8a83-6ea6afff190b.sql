-- Verificar e garantir que o bucket author-registrations tem as políticas corretas
-- Políticas para o bucket author-registrations

-- Permitir que usuários façam upload de seus próprios arquivos de áudio
CREATE POLICY IF NOT EXISTS "Users can upload their own audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'author-registrations' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários visualizem seus próprios arquivos de áudio
CREATE POLICY IF NOT EXISTS "Users can view their own audio files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'author-registrations' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários atualizem seus próprios arquivos de áudio
CREATE POLICY IF NOT EXISTS "Users can update their own audio files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'author-registrations' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários deletem seus próprios arquivos de áudio
CREATE POLICY IF NOT EXISTS "Users can delete their own audio files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'author-registrations' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que administradores vejam todos os arquivos
CREATE POLICY IF NOT EXISTS "Admins can view all audio files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'author-registrations' AND 
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);