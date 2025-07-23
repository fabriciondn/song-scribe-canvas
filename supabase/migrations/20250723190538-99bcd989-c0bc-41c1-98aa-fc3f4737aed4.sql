-- Criar tabela para registros autorais
CREATE TABLE public.author_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  other_authors TEXT,
  genre TEXT NOT NULL,
  rhythm TEXT NOT NULL,
  song_version TEXT NOT NULL,
  lyrics TEXT NOT NULL,
  audio_file_path TEXT,
  additional_info TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, registered
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.author_registrations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own author registrations" 
ON public.author_registrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own author registrations" 
ON public.author_registrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own author registrations" 
ON public.author_registrations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own author registrations" 
ON public.author_registrations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Adicionar campo de créditos na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN credits INTEGER DEFAULT 0;

-- Criar bucket para áudios dos registros autorais se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('author-registrations', 'author-registrations', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de registros autorais
CREATE POLICY "Users can upload their own author registration files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'author-registrations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own author registration files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'author-registrations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own author registration files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'author-registrations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own author registration files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'author-registrations' AND auth.uid()::text = (storage.foldername(name))[1]);