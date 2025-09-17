-- Sistema de Afiliados
-- Criar enum para status de afiliado
CREATE TYPE public.affiliate_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- Criar enum para níveis de afiliado
CREATE TYPE public.affiliate_level AS ENUM ('bronze', 'silver', 'gold');

-- Criar enum para tipos de comissão
CREATE TYPE public.commission_type AS ENUM ('author_registration', 'subscription_recurring');

-- Criar enum para status de comissão
CREATE TYPE public.commission_status AS ENUM ('pending', 'approved', 'paid', 'cancelled');

-- Tabela principal de afiliados
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  affiliate_code TEXT NOT NULL UNIQUE,
  status affiliate_status NOT NULL DEFAULT 'pending',
  level affiliate_level NOT NULL DEFAULT 'bronze',
  total_registrations INTEGER NOT NULL DEFAULT 0,
  total_subscriptions INTEGER NOT NULL DEFAULT 0,
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de comissões
CREATE TABLE public.affiliate_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- usuário que fez a conversão
  type commission_type NOT NULL,
  reference_id UUID NOT NULL, -- ID do registro autoral ou subscription
  amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL, -- porcentagem aplicada
  status commission_status NOT NULL DEFAULT 'pending',
  campaign_id UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de campanhas do afiliado
CREATE TABLE public.affiliate_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de cliques nos links de afiliado
CREATE TABLE public.affiliate_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.affiliate_campaigns(id),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de conversões
CREATE TABLE public.affiliate_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  click_id UUID REFERENCES public.affiliate_clicks(id),
  user_id UUID NOT NULL,
  type commission_type NOT NULL,
  reference_id UUID NOT NULL,
  commission_id UUID REFERENCES public.affiliate_commissions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de conquistas/achievements
CREATE TABLE public.affiliate_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- 'first_5_registrations', 'level_silver', 'level_gold', etc
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de pagamentos
CREATE TABLE public.affiliate_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid, failed
  payment_method TEXT, -- pix, bank_transfer, etc
  payment_details JSONB,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_code ON public.affiliates(affiliate_code);
CREATE INDEX idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_reference ON public.affiliate_commissions(reference_id, type);
CREATE INDEX idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_ip_date ON public.affiliate_clicks(ip_address, created_at);
CREATE INDEX idx_affiliate_conversions_affiliate_id ON public.affiliate_conversions(affiliate_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_commissions_updated_at
  BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_campaigns_updated_at
  BEFORE UPDATE ON public.affiliate_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Policies para affiliates
CREATE POLICY "Users can view their own affiliate data" 
ON public.affiliates FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their affiliate application" 
ON public.affiliates FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all affiliates" 
ON public.affiliates FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Policies para affiliate_commissions
CREATE POLICY "Affiliates can view their own commissions" 
ON public.affiliate_commissions FOR SELECT 
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all commissions" 
ON public.affiliate_commissions FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Policies para affiliate_campaigns
CREATE POLICY "Affiliates can manage their own campaigns" 
ON public.affiliate_campaigns FOR ALL 
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- Policies para affiliate_clicks
CREATE POLICY "Affiliates can view their own clicks" 
ON public.affiliate_clicks FOR SELECT 
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Public can insert clicks" 
ON public.affiliate_clicks FOR INSERT 
WITH CHECK (true);

-- Policies para affiliate_conversions
CREATE POLICY "Affiliates can view their own conversions" 
ON public.affiliate_conversions FOR SELECT 
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- Policies para affiliate_achievements
CREATE POLICY "Affiliates can view their own achievements" 
ON public.affiliate_achievements FOR SELECT 
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- Policies para affiliate_payouts
CREATE POLICY "Affiliates can view their own payouts" 
ON public.affiliate_payouts FOR SELECT 
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all payouts" 
ON public.affiliate_payouts FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Função para gerar código de afiliado único
CREATE OR REPLACE FUNCTION public.generate_affiliate_code(user_id UUID, user_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Normalizar nome do usuário
  base_code := 'compuse-' || user_id::TEXT || '-' || LOWER(REGEXP_REPLACE(user_name, '[^a-zA-Z0-9]', '', 'g'));
  final_code := base_code;
  
  -- Verificar se o código já existe e adicionar sufixo se necessário
  WHILE EXISTS (SELECT 1 FROM public.affiliates WHERE affiliate_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || '-' || counter::TEXT;
  END LOOP;
  
  RETURN final_code;
END;
$$;

-- Função para processar conversão de afiliado
CREATE OR REPLACE FUNCTION public.process_affiliate_conversion(
  p_affiliate_code TEXT,
  p_user_id UUID,
  p_type commission_type,
  p_reference_id UUID,
  p_amount DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affiliate affiliates%ROWTYPE;
  v_commission_rate DECIMAL;
  v_commission_amount DECIMAL;
BEGIN
  -- Buscar afiliado pelo código
  SELECT * INTO v_affiliate
  FROM public.affiliates
  WHERE affiliate_code = p_affiliate_code AND status = 'approved';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular taxa de comissão baseada no tipo e nível
  IF p_type = 'author_registration' THEN
    IF v_affiliate.level = 'bronze' THEN
      v_commission_rate := 25.0;
    ELSE
      v_commission_rate := 50.0;
    END IF;
  ELSIF p_type = 'subscription_recurring' THEN
    -- Só recebe comissão recorrente se for silver ou gold
    IF v_affiliate.level IN ('silver', 'gold') THEN
      IF v_affiliate.total_subscriptions < 10 THEN
        v_commission_rate := 25.0;
      ELSE
        v_commission_rate := 50.0;
      END IF;
    ELSE
      RETURN FALSE; -- Bronze não recebe comissão recorrente
    END IF;
  END IF;
  
  v_commission_amount := (p_amount * v_commission_rate) / 100;
  
  -- Inserir comissão
  INSERT INTO public.affiliate_commissions (
    affiliate_id, user_id, type, reference_id, amount, commission_rate
  ) VALUES (
    v_affiliate.id, p_user_id, p_type, p_reference_id, v_commission_amount, v_commission_rate
  );
  
  -- Atualizar estatísticas do afiliado
  IF p_type = 'author_registration' THEN
    UPDATE public.affiliates 
    SET total_registrations = total_registrations + 1,
        total_earnings = total_earnings + v_commission_amount
    WHERE id = v_affiliate.id;
  ELSIF p_type = 'subscription_recurring' THEN
    UPDATE public.affiliates 
    SET total_subscriptions = total_subscriptions + 1,
        total_earnings = total_earnings + v_commission_amount
    WHERE id = v_affiliate.id;
  END IF;
  
  -- Verificar se precisa fazer upgrade de nível
  PERFORM public.check_affiliate_level_upgrade(v_affiliate.id);
  
  RETURN TRUE;
END;
$$;

-- Função para verificar upgrade de nível
CREATE OR REPLACE FUNCTION public.check_affiliate_level_upgrade(p_affiliate_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affiliate affiliates%ROWTYPE;
BEGIN
  SELECT * INTO v_affiliate FROM public.affiliates WHERE id = p_affiliate_id;
  
  -- Upgrade para Silver (5+ registros)
  IF v_affiliate.level = 'bronze' AND v_affiliate.total_registrations >= 5 THEN
    UPDATE public.affiliates SET level = 'silver' WHERE id = p_affiliate_id;
    
    INSERT INTO public.affiliate_achievements (affiliate_id, achievement_type, achievement_name, achievement_description)
    VALUES (p_affiliate_id, 'level_silver', 'Nível Silver Desbloqueado', 'Parabéns! Você desbloqueou 50% de comissão em registros autorais.');
  END IF;
  
  -- Upgrade para Gold (100+ registros)
  IF v_affiliate.level = 'silver' AND v_affiliate.total_registrations >= 100 THEN
    UPDATE public.affiliates SET level = 'gold' WHERE id = p_affiliate_id;
    
    INSERT INTO public.affiliate_achievements (affiliate_id, achievement_type, achievement_name, achievement_description)
    VALUES (p_affiliate_id, 'level_gold', 'Nível Gold Desbloqueado', 'Parabéns! Você desbloqueou comissões recorrentes de assinaturas.');
  END IF;
END;
$$;