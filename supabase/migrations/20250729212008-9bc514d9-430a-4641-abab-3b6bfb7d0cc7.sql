-- Adicionar campos necessários para perfil completo
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Criar índice único para username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles(username) WHERE username IS NOT NULL;