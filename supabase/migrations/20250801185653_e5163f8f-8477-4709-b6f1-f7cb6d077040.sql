-- Tornar o bucket author-registrations público para permitir acesso aos arquivos de áudio
UPDATE storage.buckets 
SET public = true 
WHERE id = 'author-registrations';