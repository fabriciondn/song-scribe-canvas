-- Adicionar coluna pdf_provisorio na tabela author_registrations
ALTER TABLE public.author_registrations 
ADD COLUMN IF NOT EXISTS pdf_provisorio text;