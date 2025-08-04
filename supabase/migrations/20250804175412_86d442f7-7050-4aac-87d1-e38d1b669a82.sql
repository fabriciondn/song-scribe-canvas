-- Criar tabela para tokens de cadastro de moderadores
CREATE TABLE public.moderator_registration_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID NULL,
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.moderator_registration_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage moderator registration tokens" 
ON public.moderator_registration_tokens 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Public can view valid tokens for registration" 
ON public.moderator_registration_tokens 
FOR SELECT 
USING (
  NOT used 
  AND expires_at > now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_moderator_registration_tokens_updated_at
  BEFORE UPDATE ON public.moderator_registration_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();