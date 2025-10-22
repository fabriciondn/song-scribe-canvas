-- Adicionar coluna de comissão personalizada na tabela affiliates
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS custom_commission_rate NUMERIC(5,2) DEFAULT NULL;

COMMENT ON COLUMN public.affiliates.custom_commission_rate IS 
'Taxa de comissão personalizada (0-100). Se definida, substitui a taxa padrão do nível. Aplica-se apenas no primeiro registro autoral do indicado.';

-- Atualizar função process_affiliate_first_purchase para usar comissão personalizada
CREATE OR REPLACE FUNCTION public.process_affiliate_first_purchase(
  p_user_id uuid, 
  p_payment_amount numeric, 
  p_payment_id text
)
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
  v_custom_rate NUMERIC;
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
  
  -- Buscar afiliado, seu nível E taxa personalizada
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
    RAISE NOTICE 'Afiliado não encontrado para código: %', v_affiliate_code;
    RETURN FALSE;
  END IF;
  
  RAISE NOTICE 'Afiliado encontrado: %, Nível: %, Taxa Personalizada: %', v_affiliate_id, v_affiliate_level, v_custom_rate;
  
  -- Verificar se já existe comissão para este usuário (evitar duplicatas)
  IF EXISTS (
    SELECT 1 FROM affiliate_commissions
    WHERE affiliate_id = v_affiliate_id
      AND user_id = p_user_id
      AND type = 'author_registration'
  ) THEN
    RAISE NOTICE 'Comissão já existe para este usuário';
    RETURN FALSE;
  END IF;
  
  -- PRIORIDADE: Usar taxa personalizada se definida, senão usar taxa do nível
  IF v_custom_rate IS NOT NULL THEN
    v_commission_rate := v_custom_rate;
    RAISE NOTICE 'Usando taxa personalizada: %', v_commission_rate;
  ELSE
    -- Taxa padrão baseada no nível
    IF v_affiliate_level = 'bronze' THEN
      v_commission_rate := 25.0;
    ELSE
      v_commission_rate := 50.0;
    END IF;
    RAISE NOTICE 'Usando taxa padrão do nível: %', v_commission_rate;
  END IF;
  
  -- Calcular comissão sobre o valor pago
  v_commission_amount := p_payment_amount * (v_commission_rate / 100);
  v_commission_amount := ROUND(v_commission_amount, 2);
  
  RAISE NOTICE 'Comissão calculada: % com taxa de % sobre valor %', v_commission_amount, v_commission_rate, p_payment_amount;
  
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
  
  -- Marcar o clique mais recente como convertido
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