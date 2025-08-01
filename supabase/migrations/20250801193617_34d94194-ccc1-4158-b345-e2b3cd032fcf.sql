-- Habilitar real-time updates para a tabela profiles
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Adicionar a tabela profiles à publicação de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Habilitar real-time para user_sessions
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;

-- Habilitar real-time para user_activity_logs
ALTER TABLE public.user_activity_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_logs;