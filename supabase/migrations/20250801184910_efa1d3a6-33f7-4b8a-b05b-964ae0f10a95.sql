-- Configurar políticas para o bucket author-registrations

-- Política para upload
CREATE POLICY "Users can upload their own audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'author-registrations' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para visualização
CREATE POLICY "Users can view their own audio files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'author-registrations' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para atualização
CREATE POLICY "Users can update their own audio files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'author-registrations' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para deleção
CREATE POLICY "Users can delete their own audio files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'author-registrations' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para administradores
CREATE POLICY "Admins can view all audio files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'author-registrations' AND 
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);