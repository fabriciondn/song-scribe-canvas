
-- Verificar se a tabela credit_transactions existe e adicionar colunas necessárias
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  credits_purchased INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_id TEXT NOT NULL,
  payment_provider TEXT NOT NULL DEFAULT 'mercadopago',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Adicionar a coluna payment_provider se a tabela já existir mas não tiver a coluna
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credit_transactions' 
    AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE public.credit_transactions 
    ADD COLUMN payment_provider TEXT NOT NULL DEFAULT 'mercadopago';
  END IF;
END $$;

-- Habilitar Row Level Security
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Criar política para que usuários vejam apenas suas próprias transações
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view their own transactions" 
  ON public.credit_transactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Permitir que o service role insira transações
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.credit_transactions;
CREATE POLICY "Service role can insert transactions" 
  ON public.credit_transactions 
  FOR INSERT 
  WITH CHECK (true);

-- Permitir que o service role atualize transações
DROP POLICY IF EXISTS "Service role can update transactions" ON public.credit_transactions;
CREATE POLICY "Service role can update transactions" 
  ON public.credit_transactions 
  FOR UPDATE 
  USING (true);
