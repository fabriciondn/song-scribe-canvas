-- Criar tabela para tokens de compositor
CREATE TABLE public.composer_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_composer_tokens_user_id ON public.composer_tokens(user_id);
CREATE INDEX idx_composer_tokens_token ON public.composer_tokens(token);

-- Enable RLS
ALTER TABLE public.composer_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Usuários podem ver seus próprios tokens
CREATE POLICY "Users can view their own tokens"
ON public.composer_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar seus próprios tokens
CREATE POLICY "Users can create their own tokens"
ON public.composer_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios tokens
CREATE POLICY "Users can update their own tokens"
ON public.composer_tokens
FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios tokens
CREATE POLICY "Users can delete their own tokens"
ON public.composer_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Permitir buscar token válido para validação (qualquer usuário autenticado pode validar um token)
CREATE POLICY "Authenticated users can validate tokens"
ON public.composer_tokens
FOR SELECT
USING (
    auth.uid() IS NOT NULL 
    AND is_active = true 
    AND expires_at > now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_composer_tokens_updated_at
BEFORE UPDATE ON public.composer_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();