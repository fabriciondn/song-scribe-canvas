-- Criar tabela para lançamentos de valores pelos moderadores
CREATE TABLE public.moderator_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.moderator_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Moderators can view their own transactions" 
ON public.moderator_transactions 
FOR SELECT 
USING (moderator_id = auth.uid());

CREATE POLICY "Moderators can insert transactions for their users" 
ON public.moderator_transactions 
FOR INSERT 
WITH CHECK (
  moderator_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.moderator_users 
    WHERE moderator_id = auth.uid() AND user_id = moderator_transactions.user_id
  )
);

CREATE POLICY "Users can view their own transactions" 
ON public.moderator_transactions 
FOR SELECT 
USING (user_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_moderator_transactions_updated_at
BEFORE UPDATE ON public.moderator_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();