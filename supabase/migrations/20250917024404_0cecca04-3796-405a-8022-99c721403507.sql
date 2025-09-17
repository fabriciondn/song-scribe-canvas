-- Adicionar campos à tabela affiliates para o formulário detalhado
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS social_media_link TEXT;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS youtube_link TEXT;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS tiktok_link TEXT;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS website_link TEXT;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS promotion_strategy TEXT;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Criar tabela de solicitações de saque
CREATE TABLE IF NOT EXISTS public.affiliate_withdrawal_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'paid', 'rejected')),
  payment_method TEXT,
  payment_details JSONB,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS para a tabela de saques
ALTER TABLE public.affiliate_withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para affiliate_withdrawal_requests
CREATE POLICY "Affiliates can view their own withdrawal requests"
ON public.affiliate_withdrawal_requests 
FOR SELECT 
USING (affiliate_id IN (
  SELECT id FROM public.affiliates WHERE user_id = auth.uid()
));

CREATE POLICY "Affiliates can create their own withdrawal requests"
ON public.affiliate_withdrawal_requests 
FOR INSERT 
WITH CHECK (affiliate_id IN (
  SELECT id FROM public.affiliates WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all withdrawal requests"
ON public.affiliate_withdrawal_requests 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
));

-- Configurar usuário teste como afiliado aprovado
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Buscar ID do usuário teste
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'teste1@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    -- Inserir ou atualizar afiliado
    INSERT INTO public.affiliates (
      user_id, 
      affiliate_code, 
      status, 
      level, 
      full_name,
      contact_email,
      whatsapp,
      total_registrations,
      total_earnings,
      approved_at
    ) VALUES (
      test_user_id,
      'compuse-teste1-gold',
      'approved',
      'gold',
      'Usuário Teste',
      'teste1@gmail.com',
      '+5511999999999',
      150,
      2500.00,
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      status = 'approved',
      level = 'gold',
      full_name = 'Usuário Teste',
      contact_email = 'teste1@gmail.com',
      whatsapp = '+5511999999999',
      total_registrations = 150,
      total_earnings = 2500.00,
      approved_at = NOW();
  END IF;
END $$;