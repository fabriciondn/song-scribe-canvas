-- ============================================
-- FASE 1: CORREÇÃO MANUAL (Comissão da Erica para jhonccompositor)
-- ============================================

-- 1. Atualizar moderator_notes da Erica com código do parceiro
UPDATE public.profiles
SET moderator_notes = 'Indicado por: compuse-67b9f052-efda-43a2-ac72-c9cc1b5f7a09-jhoncay'
WHERE id = '462a4f52-303c-4da7-9b4a-f853773c25b6';

-- 2. Inserir comissão manualmente (R$ 9,99 = 50% de R$ 19,99)
INSERT INTO public.affiliate_commissions (
  affiliate_id,
  user_id,
  type,
  reference_id,
  amount,
  commission_rate,
  status,
  created_at,
  updated_at
) VALUES (
  '53d044fb-6407-47f4-987e-eb80ec7109a6', -- jhonccompositor parceiro ID
  '462a4f52-303c-4da7-9b4a-f853773c25b6', -- erica.silva.erikk@gmail.com
  'author_registration',
  'baf67edf-de26-4bc7-b39d-a1c8560b83c8', -- credit transaction ID
  9.99,
  50.00,
  'pending',
  NOW(),
  NOW()
);

-- 3. Atualizar totais do parceiro
UPDATE public.affiliates
SET 
  total_earnings = total_earnings + 9.99,
  total_registrations = total_registrations + 1,
  updated_at = NOW()
WHERE id = '53d044fb-6407-47f4-987e-eb80ec7109a6';

-- 4. Registrar conversão
INSERT INTO public.affiliate_conversions (
  affiliate_id,
  user_id,
  type,
  reference_id,
  created_at
) VALUES (
  '53d044fb-6407-47f4-987e-eb80ec7109a6',
  '462a4f52-303c-4da7-9b4a-f853773c25b6',
  'author_registration',
  'baf67edf-de26-4bc7-b39d-a1c8560b83c8',
  NOW()
);

-- ============================================
-- FASE 2: FUNÇÃO RPC PARA PROCESSAR COMISSÃO AUTOMATICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION public.process_affiliate_first_purchase(
  p_user_id UUID,
  p_payment_amount NUMERIC,
  p_payment_id TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_code TEXT;
  v_affiliate_id UUID;
  v_affiliate_level affiliate_level;
  v_custom_rate NUMERIC;
  v_commission_rate NUMERIC;
  v_commission_amount NUMERIC;
  v_already_processed BOOLEAN;
BEGIN
  RAISE NOTICE 'Processando primeira compra - User: %, Valor: %, Payment: %', p_user_id, p_payment_amount, p_payment_id;
  
  -- 1. Buscar código de parceiro nas notas do perfil
  SELECT moderator_notes INTO v_affiliate_code
  FROM profiles
  WHERE id = p_user_id;
  
  -- Se não tem nota de parceiro, retornar
  IF v_affiliate_code IS NULL OR v_affiliate_code NOT LIKE '%Indicado por:%' THEN
    RAISE NOTICE 'Usuário não foi indicado por parceiro';
    RETURN FALSE;
  END IF;
  
  -- Extrair código do formato "Indicado por: compuse-..."
  v_affiliate_code := regexp_replace(v_affiliate_code, '.*Indicado por:\s*([^\n]+).*', '\1');
  v_affiliate_code := TRIM(v_affiliate_code);
  
  RAISE NOTICE 'Código de parceiro extraído: %', v_affiliate_code;
  
  -- 2. Buscar parceiro, seu nível E taxa personalizada
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
    RAISE NOTICE 'Parceiro não encontrado para código: %', v_affiliate_code;
    RETURN FALSE;
  END IF;
  
  RAISE NOTICE 'Parceiro encontrado: %, Nível: %, Taxa Personalizada: %', v_affiliate_id, v_affiliate_level, v_custom_rate;
  
  -- 3. Verificar se já existe comissão para este usuário (evitar duplicatas)
  SELECT EXISTS (
    SELECT 1 FROM affiliate_commissions
    WHERE affiliate_id = v_affiliate_id
      AND user_id = p_user_id
      AND type = 'author_registration'
  ) INTO v_already_processed;
  
  IF v_already_processed THEN
    RAISE NOTICE 'Comissão já existe para este usuário';
    RETURN FALSE;
  END IF;
  
  -- 4. PRIORIDADE: Usar taxa personalizada se definida, senão usar taxa do nível
  IF v_custom_rate IS NOT NULL THEN
    v_commission_rate := v_custom_rate;
    RAISE NOTICE 'Usando taxa personalizada: %', v_commission_rate;
  ELSE
    -- Taxa padrão baseada no nível
    v_commission_rate := CASE v_affiliate_level
      WHEN 'bronze' THEN 25.0
      WHEN 'silver' THEN 50.0
      WHEN 'gold' THEN 50.0
      ELSE 25.0
    END;
    RAISE NOTICE 'Usando taxa padrão do nível: %', v_commission_rate;
  END IF;
  
  -- 5. Calcular comissão sobre o valor pago
  v_commission_amount := p_payment_amount * (v_commission_rate / 100);
  v_commission_amount := ROUND(v_commission_amount, 2);
  
  RAISE NOTICE 'Comissão calculada: % com taxa de % sobre valor %', v_commission_amount, v_commission_rate, p_payment_amount;
  
  -- 6. Criar comissão
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
  
  -- 7. Atualizar earnings do parceiro
  UPDATE affiliates
  SET 
    total_earnings = total_earnings + v_commission_amount,
    total_registrations = total_registrations + 1,
    updated_at = NOW()
  WHERE id = v_affiliate_id;
  
  -- 8. Registrar conversão
  INSERT INTO affiliate_conversions (
    affiliate_id,
    user_id,
    type,
    reference_id
  ) VALUES (
    v_affiliate_id,
    p_user_id,
    'author_registration',
    COALESCE(p_payment_id::UUID, p_user_id)
  );
  
  -- 9. Marcar o clique mais recente como convertido
  UPDATE affiliate_clicks
  SET converted = TRUE
  WHERE id = (
    SELECT id FROM affiliate_clicks
    WHERE affiliate_id = v_affiliate_id
      AND converted = FALSE
    ORDER BY created_at DESC
    LIMIT 1
  );
  
  RAISE NOTICE 'Comissão criada com sucesso para parceiro: %', v_affiliate_id;
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao processar comissão: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- ============================================
-- FASE 3: HABILITAR REALTIME PARA COMISSÕES
-- ============================================

ALTER TABLE public.affiliate_commissions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions;