-- Adicionar campo hash na tabela author_registrations
ALTER TABLE public.author_registrations 
ADD COLUMN hash TEXT;