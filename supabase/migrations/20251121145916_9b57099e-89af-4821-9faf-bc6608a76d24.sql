-- Aumentar limite de tamanho do bucket temp-pdfs para 50MB
UPDATE storage.buckets 
SET file_size_limit = 52428800
WHERE id = 'temp-pdfs';