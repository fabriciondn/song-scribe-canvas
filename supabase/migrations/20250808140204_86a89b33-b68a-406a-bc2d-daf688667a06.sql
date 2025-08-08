-- Verificar se a tabela public_registration_forms existe e criar se necessário
CREATE TABLE IF NOT EXISTS public.public_registration_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artistic_name TEXT,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  birth_date DATE NOT NULL,
  cep TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.public_registration_forms ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir inserção de qualquer pessoa (formulário público)
CREATE POLICY "Qualquer pessoa pode inserir formulários públicos" 
ON public.public_registration_forms 
FOR INSERT 
WITH CHECK (true);

-- Criar política para administradores visualizarem os formulários
CREATE POLICY "Apenas admins podem ver formulários públicos" 
ON public.public_registration_forms 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_public_registration_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualização automática do timestamp
CREATE TRIGGER update_public_registration_forms_updated_at
  BEFORE UPDATE ON public.public_registration_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_public_registration_forms_updated_at();