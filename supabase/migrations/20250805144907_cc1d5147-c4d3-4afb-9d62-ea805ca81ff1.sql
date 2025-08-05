-- Habilitar realtime para a tabela profiles
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Adicionar a tabela ao publication do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;