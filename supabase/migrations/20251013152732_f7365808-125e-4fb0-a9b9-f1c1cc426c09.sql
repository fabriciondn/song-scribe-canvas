-- Atualizar função process_affiliate_conversion para inserir em affiliate_conversions
CREATE OR REPLACE FUNCTION public.process_affiliate_conversion(
  p_affiliate_code TEXT,
  p_user_id UUID,
  p_type commission_type,
  p_reference_id UUID,
  p_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affiliate affiliates%ROWTYPE;
  v_commission_rate DECIMAL;
  v_commission_amount DECIMAL;
  v_active_subscriptions INTEGER;
  v_registration_price DECIMAL := 19.99;
  v_subscription_price DECIMAL := 15.00;
  v_commission_id UUID;
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
    -- Usar o valor real passado como parâmetro
    IF v_affiliate.total_registrations < 5 THEN
      v_commission_rate := 25.0;
      v_commission_amount := p_amount * 0.25;
    ELSE
      v_commission_rate := 50.0;
      v_commission_amount := p_amount * 0.50;
    END IF;
  ELSIF p_type = 'subscription_recurring' THEN
    -- Só recebe comissão recorrente se for gold
    IF v_affiliate.level = 'gold' THEN
      SELECT COUNT(*) INTO v_active_subscriptions
      FROM public.affiliate_commissions
      WHERE affiliate_id = v_affiliate.id
        AND type = 'subscription_recurring'
        AND status = 'paid';
      
      IF v_active_subscriptions < 10 THEN
        v_commission_rate := 25.0;
        v_commission_amount := v_subscription_price * 0.25;
      ELSE
        v_commission_rate := 50.0;
        v_commission_amount := v_subscription_price * 0.50;
      END IF;
    ELSE
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Inserir comissão
  INSERT INTO public.affiliate_commissions (
    affiliate_id, user_id, type, reference_id, amount, commission_rate
  ) VALUES (
    v_affiliate.id, p_user_id, p_type, p_reference_id, v_commission_amount, v_commission_rate
  ) RETURNING id INTO v_commission_id;
  
  -- Inserir na tabela de conversões para rastreamento
  INSERT INTO public.affiliate_conversions (
    affiliate_id, user_id, type, reference_id, commission_id
  ) VALUES (
    v_affiliate.id, p_user_id, p_type, p_reference_id, v_commission_id
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