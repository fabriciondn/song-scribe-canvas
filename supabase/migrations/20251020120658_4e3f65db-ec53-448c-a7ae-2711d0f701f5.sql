-- ========================================
-- FASE 1: Corrigir função process_affiliate_registration
-- ========================================

CREATE OR REPLACE FUNCTION public.process_affiliate_registration(
  p_affiliate_code TEXT,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_affiliate_id UUID;
  v_current_registrations INTEGER;
  v_click_id UUID;
BEGIN
  -- Log da entrada
  RAISE NOTICE 'Iniciando process_affiliate_registration - Código: %, User ID: %', p_affiliate_code, p_user_id;
  
  -- Buscar afiliado (aceitar códigos com ou sem "compuse-" prefix)
  SELECT id, total_registrations INTO v_affiliate_id, v_current_registrations
  FROM affiliates
  WHERE (
    affiliate_code = p_affiliate_code 
    OR affiliate_code = 'compuse-' || p_affiliate_code
    OR affiliate_code = regexp_replace(p_affiliate_code, '^compuse-', '')
  )
  AND status = 'approved'
  LIMIT 1;
  
  IF v_affiliate_id IS NULL THEN
    RAISE NOTICE 'Afiliado não encontrado para código: %', p_affiliate_code;
    RETURN FALSE;
  END IF;
  
  RAISE NOTICE 'Afiliado encontrado - ID: %, Registros atuais: %', v_affiliate_id, v_current_registrations;
  
  -- Criar conversão (rastreamento de cadastro)
  INSERT INTO affiliate_conversions (
    affiliate_id, 
    user_id, 
    type, 
    reference_id
  ) VALUES (
    v_affiliate_id, 
    p_user_id, 
    'author_registration', 
    p_user_id
  )
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Conversão criada para afiliado: %', v_affiliate_id;
  
  -- Incrementar total de registros
  UPDATE affiliates
  SET total_registrations = COALESCE(total_registrations, 0) + 1,
      updated_at = NOW()
  WHERE id = v_affiliate_id;
  
  RAISE NOTICE 'Total de registros atualizado para afiliado: %', v_affiliate_id;
  
  -- Buscar último clique não convertido e marcar como convertido
  SELECT id INTO v_click_id
  FROM affiliate_clicks
  WHERE affiliate_id = v_affiliate_id
    AND converted = FALSE
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_click_id IS NOT NULL THEN
    UPDATE affiliate_clicks
    SET converted = TRUE
    WHERE id = v_click_id;
    
    RAISE NOTICE 'Clique % marcado como convertido', v_click_id;
  ELSE
    RAISE NOTICE 'Nenhum clique não convertido encontrado';
  END IF;
  
  -- Atualizar perfil do usuário com nota de indicação
  UPDATE profiles
  SET moderator_notes = COALESCE(moderator_notes, '') || E'\nIndicado por: ' || p_affiliate_code
  WHERE id = p_user_id
    AND (moderator_notes IS NULL OR moderator_notes NOT LIKE '%Indicado por:%');
  
  RAISE NOTICE 'Perfil do usuário atualizado com nota de indicação';
  
  RAISE NOTICE 'Conversão processada com sucesso para afiliado: %', v_affiliate_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao processar conversão: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- ========================================
-- FASE 2: Criar função de comissão na primeira compra
-- ========================================

CREATE OR REPLACE FUNCTION public.process_affiliate_first_purchase(
  p_user_id UUID,
  p_payment_amount NUMERIC,
  p_payment_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_affiliate_code TEXT;
  v_affiliate_id UUID;
  v_commission_amount NUMERIC;
BEGIN
  RAISE NOTICE 'Processando primeira compra - User: %, Valor: %', p_user_id, p_payment_amount;
  
  -- Buscar código de afiliado nas notas do perfil
  SELECT moderator_notes INTO v_affiliate_code
  FROM profiles
  WHERE id = p_user_id;
  
  -- Se não tem nota de afiliado, retornar
  IF v_affiliate_code IS NULL OR v_affiliate_code NOT LIKE '%Indicado por:%' THEN
    RAISE NOTICE 'Usuário não foi indicado por afiliado';
    RETURN FALSE;
  END IF;
  
  -- Extrair código do formato "Indicado por: compuse-..."
  v_affiliate_code := regexp_replace(v_affiliate_code, '.*Indicado por: ([^\n]+).*', '\1');
  
  RAISE NOTICE 'Código de afiliado extraído: %', v_affiliate_code;
  
  -- Buscar afiliado
  SELECT id INTO v_affiliate_id
  FROM affiliates
  WHERE (
    affiliate_code = v_affiliate_code
    OR affiliate_code = 'compuse-' || v_affiliate_code
    OR affiliate_code = regexp_replace(v_affiliate_code, '^compuse-', '')
  )
  AND status = 'approved'
  LIMIT 1;
  
  IF v_affiliate_id IS NULL THEN
    RAISE NOTICE 'Afiliado não encontrado para código: %', v_affiliate_code;
    RETURN FALSE;
  END IF;
  
  RAISE NOTICE 'Afiliado encontrado: %', v_affiliate_id;
  
  -- Verificar se já existe comissão para este usuário
  IF EXISTS (
    SELECT 1 FROM affiliate_commissions
    WHERE affiliate_id = v_affiliate_id
      AND user_id = p_user_id
      AND type = 'author_registration'
  ) THEN
    RAISE NOTICE 'Comissão já existe para este usuário';
    RETURN FALSE;
  END IF;
  
  -- Calcular comissão: 50% do valor pago
  v_commission_amount := p_payment_amount * 0.50;
  
  RAISE NOTICE 'Comissão calculada: R$ %', v_commission_amount;
  
  -- Criar comissão
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
    p_user_id::UUID,
    v_commission_amount,
    50.0,
    'pending'
  );
  
  -- Atualizar earnings do afiliado
  UPDATE affiliates
  SET total_earnings = total_earnings + v_commission_amount,
      updated_at = NOW()
  WHERE id = v_affiliate_id;
  
  RAISE NOTICE 'Comissão criada com sucesso para afiliado: %', v_affiliate_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao processar comissão: %', SQLERRM;
    RETURN FALSE;
END;
$$;