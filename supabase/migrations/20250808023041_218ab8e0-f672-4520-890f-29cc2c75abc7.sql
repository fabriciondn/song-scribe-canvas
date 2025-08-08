-- Habilitar realtime para a tabela author_registrations
ALTER TABLE public.author_registrations REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.author_registrations;