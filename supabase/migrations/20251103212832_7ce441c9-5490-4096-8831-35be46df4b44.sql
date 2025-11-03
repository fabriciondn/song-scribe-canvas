
-- Corrigir função para processar comissão APENAS na primeira compra
CREATE OR REPLACE FUNCTION public.process_affiliate_first_purchase(
  p_user_id uuid, 
  p_payment_amount numeric, 
  p_payment_id text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_affiliate_code TEXT;
  v_affiliate_id UUID;
  v_affiliate_level affiliate_level;
  v_custom_rate NUMERIC;
  v_commission_rate NUMERIC;
  v_commission_amount NUMERIC;
  v_already_processed BOOLEAN;
  v_has_valid_click BOOLEAN;
BEGIN
  RAISE NOTICE 'Processando primeira compra - User: %, Valor: %, Payment: %', p_user_id, p_payment_amount, p_payment_id;
  
  -- 1. Buscar código de parceiro nas notas do perfil
  SELECT moderator_notes INTO v_affiliate_code
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_affiliate_code IS NULL OR v_affiliate_code NOT LIKE '%Indicado por:%' THEN
    RAISE NOTICE 'Usuário não foi indicado por parceiro';
    RETURN FALSE;
  END IF;
  
  v_affiliate_code := regexp_replace(v_affiliate_code, '.*Indicado por:\s*([^\n]+).*', '\1');
  v_affiliate_code := TRIM(v_affiliate_code);
  
  RAISE NOTICE 'Código de parceiro extraído: %', v_affiliate_code;
  
  -- 2. Buscar parceiro
  SELECT id, level, custom_commission_rate 
  INTO v_affiliate_id, v_affiliate_level, v_custom_rate
  FROM affiliates
  WHERE (
    affiliate_code = v_affiliate_code
    OR affiliate_code = 'compuse-' || v_affiliate_code
    OR affiliate_code = regexp_replace(v_affiliate_code, '^compuse-', '')
  )
  AND status = 'approved'
  LIMIT 1;
  
  IF v_affiliate_id IS NULL THEN
    RAISE NOTICE 'Parceiro não encontrado';
    RETURN FALSE;
  END IF;
  
  -- 3. VALIDAÇÃO: Verificar se existe clique convertido do usuário
  SELECT EXISTS (
    SELECT 1 FROM affiliate_clicks 
    WHERE affiliate_id = v_affiliate_id 
    AND user_id = p_user_id
    AND converted = true
  ) INTO v_has_valid_click;
  
  IF NOT v_has_valid_click THEN
    RAISE NOTICE 'Usuário não tem clique válido registrado para este afiliado';
    RETURN FALSE;
  END IF;
  
  -- 4. VALIDAÇÃO CRÍTICA: Verificar se já existe QUALQUER comissão anterior para este usuário
  -- Isso garante que a comissão seja processada APENAS NA PRIMEIRA COMPRA
  SELECT EXISTS (
    SELECT 1 FROM affiliate_commissions
    WHERE affiliate_id = v_affiliate_id
      AND user_id = p_user_id
  ) INTO v_already_processed;
  
  IF v_already_processed THEN
    RAISE NOTICE 'Comissão já processada anteriormente para este usuário - não é primeira compra';
    RETURN FALSE;
  END IF;
  
  -- 5. PRIORIZAR custom_commission_rate
  IF v_custom_rate IS NOT NULL THEN
    v_commission_rate := v_custom_rate;
    RAISE NOTICE 'Usando taxa personalizada: %', v_commission_rate;
  ELSE
    v_commission_rate := CASE v_affiliate_level
      WHEN 'bronze' THEN 25.0
      WHEN 'silver' THEN 50.0
      WHEN 'gold' THEN 50.0
      ELSE 25.0
    END;
    RAISE NOTICE 'Usando taxa padrão: %', v_commission_rate;
  END IF;
  
  -- 6. Calcular comissão
  v_commission_amount := p_payment_amount * (v_commission_rate / 100);
  v_commission_amount := ROUND(v_commission_amount, 2);
  
  -- 7. Criar comissão (APENAS PRIMEIRA COMPRA)
  INSERT INTO affiliate_commissions (
    affiliate_id,
    user_id,
    type,
    reference_id,
    amount,
    commission_rate,
    status
  ) VALUES (
    v_affiliate_id,
    p_user_id,
    'author_registration',
    COALESCE(p_payment_id::UUID, p_user_id),
    v_commission_amount,
    v_commission_rate,
    'pending'
  );
  
  -- 8. Atualizar earnings
  UPDATE affiliates
  SET 
    total_earnings = total_earnings + v_commission_amount,
    total_registrations = total_registrations + 1,
    updated_at = NOW()
  WHERE id = v_affiliate_id;
  
  -- 9. Registrar conversão COM click_id
  INSERT INTO affiliate_conversions (
    affiliate_id,
    user_id,
    type,
    reference_id,
    click_id
  ) 
  SELECT 
    v_affiliate_id,
    p_user_id,
    'author_registration',
    COALESCE(p_payment_id::UUID, p_user_id),
    id
  FROM affiliate_clicks
  WHERE affiliate_id = v_affiliate_id
    AND user_id = p_user_id
    AND converted = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  RAISE NOTICE 'Comissão criada com sucesso - PRIMEIRA COMPRA';
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro: %', SQLERRM;
    RETURN FALSE;
END;
$function$;
