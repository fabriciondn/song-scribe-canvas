-- Melhorar sistema de rastreamento de usuários online e sessões
-- Criar tabela para rastreamento de sessões em tempo real
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Habilitar RLS na tabela de logs de atividade
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir que admins vejam todos os logs
CREATE POLICY "Admins can view all activity logs" 
ON public.user_activity_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Política para permitir que usuários insiram seus próprios logs
CREATE POLICY "Users can insert their own activity logs" 
ON public.user_activity_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Atualizar a tabela user_sessions existente para melhor rastreamento
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id_timestamp 
ON public.user_activity_logs(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_timestamp 
ON public.user_activity_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active_last_activity 
ON public.user_sessions(is_active, last_activity DESC);

-- Função para calcular usuários online (ativos nos últimos 5 minutos)
CREATE OR REPLACE FUNCTION public.get_online_users_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(DISTINCT user_id)::INTEGER
  FROM public.user_sessions 
  WHERE is_active = true 
  AND last_activity > NOW() - INTERVAL '5 minutes';
$$;

-- Função para registrar atividade do usuário
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_action TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_activity_logs (user_id, action, metadata)
  VALUES (auth.uid(), p_action, p_metadata);
  
  -- Atualizar sessão ativa
  INSERT INTO public.user_sessions (user_id, session_id, last_activity, is_active)
  VALUES (
    auth.uid(), 
    gen_random_uuid()::text, 
    NOW(), 
    true
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_activity = NOW(),
    is_active = true;
END;
$$;