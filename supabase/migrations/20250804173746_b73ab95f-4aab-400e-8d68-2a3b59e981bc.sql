-- Criar tabela para rastrear quais usuários foram criados por moderadores
CREATE TABLE public.moderator_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id) -- Um usuário só pode ser criado por um moderador
);

-- Enable RLS
ALTER TABLE public.moderator_users ENABLE ROW LEVEL SECURITY;