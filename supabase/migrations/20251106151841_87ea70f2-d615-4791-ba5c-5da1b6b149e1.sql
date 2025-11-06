-- ETAPA 1: Corrigir Earnings do Jhonc
UPDATE affiliates
SET total_earnings = 109.95
WHERE user_id = (SELECT id FROM profiles WHERE email = 'jhonccompositor@gmail.com');

-- ETAPA 2: Zerar Earnings do Sandro e Remover Indicação do Fabricio
UPDATE affiliates
SET total_earnings = 0.00,
    total_registrations = 0
WHERE user_id = (SELECT id FROM profiles WHERE email = 'sandropopcompositor@gmail.com');

UPDATE profiles
SET moderator_notes = REPLACE(moderator_notes, 'Indicado por: compuse-7a3db71d-bcdc-4238-880f-775ed11d5124-sandropop', '')
WHERE email = 'fabricionedino2@gmail.com';

-- ETAPA 3.1: Adicionar coluna para rastrear comissões pagas
ALTER TABLE affiliate_commissions 
ADD COLUMN IF NOT EXISTS paid_in_withdrawal_id uuid REFERENCES affiliate_withdrawal_requests(id);

CREATE INDEX IF NOT EXISTS idx_commissions_paid_withdrawal 
ON affiliate_commissions(paid_in_withdrawal_id);

-- ETAPA 3.2: Criar função para marcar comissões ao processar saque
CREATE OR REPLACE FUNCTION mark_commissions_as_paid(
  p_withdrawal_id uuid,
  p_affiliate_id uuid,
  p_amount numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission RECORD;
  v_remaining numeric := p_amount;
BEGIN
  RAISE NOTICE '💰 Marcando comissões como pagas - Saque: %, Valor: %', p_withdrawal_id, p_amount;
  
  -- Buscar comissões pendentes validadas (mais antigas primeiro)
  FOR v_commission IN
    SELECT id, amount, created_at
    FROM affiliate_commissions
    WHERE affiliate_id = p_affiliate_id
      AND status = 'pending'
      AND validated_at IS NOT NULL
      AND paid_in_withdrawal_id IS NULL
    ORDER BY created_at ASC
  LOOP
    EXIT WHEN v_remaining <= 0;
    
    -- Marcar comissão como paga neste saque
    UPDATE affiliate_commissions
    SET paid_in_withdrawal_id = p_withdrawal_id,
        updated_at = NOW()
    WHERE id = v_commission.id;
    
    RAISE NOTICE '✅ Comissão marcada: R$ % (Data: %)', v_commission.amount, v_commission.created_at;
    
    v_remaining := v_remaining - v_commission.amount;
  END LOOP;
  
  RAISE NOTICE '🎯 Total marcado: R$ %, Restante: R$ %', p_amount, GREATEST(v_remaining, 0);
END;
$$;

-- ETAPA 3.3: Atualizar função de processamento de saque
CREATE OR REPLACE FUNCTION public.process_affiliate_withdrawal_payment(p_withdrawal_id uuid, p_admin_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_affiliate_id uuid;
  v_amount numeric;
BEGIN
  -- Verificar se admin tem permissão
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = p_admin_id
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem processar pagamentos';
  END IF;

  -- Buscar dados da solicitação
  SELECT affiliate_id, amount 
  INTO v_affiliate_id, v_amount
  FROM affiliate_withdrawal_requests
  WHERE id = p_withdrawal_id AND status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou não aprovada';
  END IF;

  -- Verificar se afiliado tem saldo suficiente
  IF NOT EXISTS (
    SELECT 1 FROM affiliates 
    WHERE id = v_affiliate_id 
    AND total_earnings >= v_amount
  ) THEN
    RAISE EXCEPTION 'Saldo insuficiente do afiliado';
  END IF;

  -- Atualizar status da solicitação
  UPDATE affiliate_withdrawal_requests
  SET 
    status = 'paid',
    processed_at = NOW(),
    processed_by = p_admin_id,
    updated_at = NOW()
  WHERE id = p_withdrawal_id;

  -- Deduzir do saldo disponível e adicionar ao total pago
  UPDATE affiliates
  SET 
    total_paid = total_paid + v_amount,
    total_earnings = total_earnings - v_amount,
    updated_at = NOW()
  WHERE id = v_affiliate_id;

  -- NOVO: Marcar comissões como pagas
  PERFORM mark_commissions_as_paid(
    p_withdrawal_id,
    v_affiliate_id,
    v_amount
  );

  RETURN true;
END;
$function$;

-- ETAPA 5: Marcar Retroativamente o Saque do Jhonc
DO $$
DECLARE
  v_withdrawal_id uuid := '18e6feab-1af5-49a9-a748-28bb9d463a24';
  v_affiliate_id uuid;
  v_commission1_id uuid := '50a5aa2d-d794-4b81-ab07-8fce1d235c52'; -- R$ 89.95
  v_commission2_id uuid := '9fac7753-7ae5-4f1b-a5ec-c606a0d723b8'; -- R$ 10.00
BEGIN
  -- Buscar ID do afiliado Jhonc
  SELECT id INTO v_affiliate_id
  FROM affiliates
  WHERE user_id = (SELECT id FROM profiles WHERE email = 'jhonccompositor@gmail.com');
  
  IF v_affiliate_id IS NULL THEN
    RAISE NOTICE '⚠️ Afiliado Jhonc não encontrado';
    RETURN;
  END IF;
  
  RAISE NOTICE '📋 Marcando comissões retroativas do Jhonc (Saque: %)', v_withdrawal_id;
  
  -- Marcar R$ 89.95 + R$ 10.00 = R$ 99.95 como pagas no saque anterior
  UPDATE affiliate_commissions
  SET paid_in_withdrawal_id = v_withdrawal_id,
      updated_at = NOW()
  WHERE id IN (v_commission1_id, v_commission2_id)
    AND affiliate_id = v_affiliate_id;
  
  RAISE NOTICE '✅ Comissões retroativas marcadas: R$ 89.95 + R$ 10.00 = R$ 99.95';
  RAISE NOTICE '💰 Saldo restante: R$ 9.95 (Comissão da Érica)';
END $$;