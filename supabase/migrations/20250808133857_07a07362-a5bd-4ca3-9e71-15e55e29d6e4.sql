-- Criar tabela para formulários públicos de registro
CREATE TABLE public.public_registration_forms (
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

-- Enable RLS
ALTER TABLE public.public_registration_forms ENABLE ROW LEVEL SECURITY;

-- Política para admins visualizarem todos os formulários
CREATE POLICY "Admins can view all public registration forms" 
ON public.public_registration_forms 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid()
));

-- Política para permitir inserção pública (sem autenticação)
CREATE POLICY "Anyone can insert public registration forms" 
ON public.public_registration_forms 
FOR INSERT 
WITH CHECK (true);

-- Adicionar trigger para updated_at
CREATE TRIGGER update_public_registration_forms_updated_at
BEFORE UPDATE ON public.public_registration_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();