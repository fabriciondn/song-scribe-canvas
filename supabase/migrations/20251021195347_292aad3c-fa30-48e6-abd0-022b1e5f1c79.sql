-- ============================================
-- FASE 1: CORREÇÃO MANUAL DOS DADOS EXISTENTES
-- ============================================

-- 1. Atualizar perfil do Carlos com nota de indicação
UPDATE public.profiles 
SET moderator_notes = 'Indicado por: compuse-67b9f052-efda-43a2-ac72-c9cc1b5f7a09-jhoncay'
WHERE id = 'f49fb836-a7d7-4737-9e3f-505ab97daa80';

-- 2. Criar conversão manualmente
INSERT INTO public.affiliate_conversions (
  affiliate_id, 
  user_id, 
  type, 
  reference_id
) VALUES (
  '53d044fb-6407-47f4-987e-eb80ec7109a6',
  'f49fb836-a7d7-4737-9e3f-505ab97daa80',
  'author_registration',
  'f49fb836-a7d7-4737-9e3f-505ab97daa80'::uuid
)
ON CONFLICT DO NOTHING;

-- 3. Criar comissão manualmente (50% de R$ 179,90 = R$ 89,95)
INSERT INTO public.affiliate_commissions (
  affiliate_id,
  user_id,
  type,
  reference_id,
  amount,
  commission_rate,
  status
) VALUES (
  '53d044fb-6407-47f4-987e-eb80ec7109a6',
  'f49fb836-a7d7-4737-9e3f-505ab97daa80',
  'author_registration',
  'f49fb836-a7d7-4737-9e3f-505ab97daa80'::uuid,
  89.95,
  50.0,
  'pending'
)
ON CONFLICT DO NOTHING;

-- 4. Atualizar estatísticas do afiliado Jhon
UPDATE public.affiliates 
SET 
  total_registrations = total_registrations + 1,
  total_earnings = total_earnings + 89.95,
  updated_at = NOW()
WHERE id = '53d044fb-6407-47f4-987e-eb80ec7109a6';

-- 5. Marcar o clique mais recente como convertido
UPDATE public.affiliate_clicks 
SET converted = true
WHERE id = 'a86f2da6-3669-45ac-86e0-e26787bef7b0';

-- ============================================
-- FASE 2: ATUALIZAR FUNÇÕES SQL
-- ============================================

-- Recriar função process_affiliate_registration com melhorias
CREATE OR REPLACE FUNCTION public.process_affiliate_registration(p_affiliate_code text, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_affiliate_id UUID;
  v_current_registrations INTEGER;
  v_click_id UUID;
  v_normalized_code TEXT;
BEGIN
  -- Log da entrada
  RAISE NOTICE 'Iniciando process_affiliate_registration - Código: %, User ID: %', p_affiliate_code, p_user_id;
  
  -- Normalizar o código (remover prefixo compuse- se existir)
  v_normalized_code := regexp_replace(p_affiliate_code, '^compuse-', '');
  
  -- Buscar afiliado (aceitar códigos com ou sem "compuse-" prefix)
  SELECT id, total_registrations INTO v_affiliate_id, v_current_registrations
  FROM affiliates
  WHERE (
    affiliate_code = p_affiliate_code 
    OR affiliate_code = 'compuse-' || p_affiliate_code
    OR affiliate_code = v_normalized_code
    OR affiliate_code = 'compuse-' || v_normalized_code
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
  
  -- Atualizar perfil do usuário com nota de indicação (usar o código original completo)
  UPDATE profiles
  SET moderator_notes = COALESCE(moderator_notes, '') || 
    CASE 
      WHEN COALESCE(moderator_notes, '') = '' THEN ''
      ELSE E'\n'
    END ||
    'Indicado por: ' || 
    CASE 
      WHEN p_affiliate_code LIKE 'compuse-%' THEN p_affiliate_code
      ELSE 'compuse-' || p_affiliate_code
    END
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
$function$;

-- Recriar função process_affiliate_first_purchase com melhorias
CREATE OR REPLACE FUNCTION public.process_affiliate_first_purchase(p_user_id uuid, p_payment_amount numeric, p_payment_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_affiliate_code TEXT;
  v_affiliate_id UUID;
  v_commission_amount NUMERIC;
  v_affiliate_level TEXT;
  v_commission_rate NUMERIC;
BEGIN
  RAISE NOTICE 'Processando primeira compra - User: %, Valor: %, Payment: %', p_user_id, p_payment_amount, p_payment_id;
  
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
  v_affiliate_code := regexp_replace(v_affiliate_code, '.*Indicado por:\s*([^\n]+).*', '\1');
  v_affiliate_code := TRIM(v_affiliate_code);
  
  RAISE NOTICE 'Código de afiliado extraído: %', v_affiliate_code;
  
  -- Buscar afiliado e seu nível
  SELECT id, level INTO v_affiliate_id, v_affiliate_level
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
  
  RAISE NOTICE 'Afiliado encontrado: %, Nível: %', v_affiliate_id, v_affiliate_level;
  
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
  
  -- Calcular comissão baseada no nível do afiliado
  -- Bronze ou sem registros: 25%
  -- Silver (5+ registros): 50%
  IF v_affiliate_level = 'bronze' THEN
    v_commission_rate := 25.0;
    v_commission_amount := p_payment_amount * 0.25;
  ELSE
    v_commission_rate := 50.0;
    v_commission_amount := p_payment_amount * 0.50;
  END IF;
  
  -- Arredondar para 2 casas decimais
  v_commission_amount := ROUND(v_commission_amount, 2);
  
  RAISE NOTICE 'Comissão calculada: R$ % (taxa: %)', v_commission_amount, v_commission_rate;
  
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
    v_commission_rate,
    'pending'
  );
  
  -- Atualizar earnings do afiliado
  UPDATE affiliates
  SET total_earnings = total_earnings + v_commission_amount,
      updated_at = NOW()
  WHERE id = v_affiliate_id;
  
  -- Marcar o clique mais recente como convertido (se ainda não foi)
  UPDATE affiliate_clicks
  SET converted = TRUE
  WHERE id = (
    SELECT id FROM affiliate_clicks
    WHERE affiliate_id = v_affiliate_id
      AND converted = FALSE
    ORDER BY created_at DESC
    LIMIT 1
  );
  
  RAISE NOTICE 'Comissão criada com sucesso para afiliado: %', v_affiliate_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao processar comissão: %', SQLERRM;
    RETURN FALSE;
END;
$function$;