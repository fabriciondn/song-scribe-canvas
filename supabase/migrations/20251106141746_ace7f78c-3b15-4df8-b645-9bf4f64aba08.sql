-- Migration: Criar cliques retroativos e processar comissões para indicados do Jhoncay
-- Data: 2025-01-06
-- Descrição: Corrigir comissões não processadas de usuários indicados

DO $$
DECLARE
  v_jhoncay_affiliate_id uuid;
  v_user_id uuid;
  v_user_name text;
  v_user_email text;
  v_payment_amount numeric;
  v_transaction_id uuid;
  v_result boolean;
BEGIN
  -- Buscar ID do afiliado Jhoncay
  SELECT id INTO v_jhoncay_affiliate_id
  FROM affiliates 
  WHERE affiliate_code LIKE '%jhoncay%'
  LIMIT 1;
  
  RAISE NOTICE '📋 Afiliado Jhoncay ID: %', v_jhoncay_affiliate_id;
  
  IF v_jhoncay_affiliate_id IS NULL THEN
    RAISE EXCEPTION 'Afiliado Jhoncay não encontrado';
  END IF;
  
  -- Processar cada usuário individualmente
  
  -- 1. José Carlos (transação mais recente)
  v_user_id := 'f49fb836-a7d7-4737-9e3f-505ab97daa80';
  v_transaction_id := '237b4615-625d-4953-b30f-d7389ddb171c';
  v_payment_amount := 179.90;
  
  SELECT name, email INTO v_user_name, v_user_email
  FROM profiles WHERE id = v_user_id;
  
  RAISE NOTICE '🔄 Processando: % (%)', v_user_name, v_user_email;
  
  -- Criar clique se não existir
  INSERT INTO affiliate_clicks (
    affiliate_id, user_id, converted, created_at
  )
  SELECT 
    v_jhoncay_affiliate_id,
    v_user_id,
    true,
    p.created_at
  FROM profiles p
  WHERE p.id = v_user_id
  ON CONFLICT DO NOTHING;
  
  -- Processar comissão
  SELECT process_affiliate_first_purchase(
    v_user_id,
    v_payment_amount,
    v_transaction_id::text
  ) INTO v_result;
  
  RAISE NOTICE '✅ Resultado: %', v_result;
  
  -- 2. Espedito
  v_user_id := '94d2ef4f-174b-4c0e-82ea-35739a67d240';
  v_transaction_id := '6c33b178-0036-409e-9cca-01e3bfa9e17e';
  v_payment_amount := 19.99;
  
  SELECT name, email INTO v_user_name, v_user_email
  FROM profiles WHERE id = v_user_id;
  
  RAISE NOTICE '🔄 Processando: % (%)', v_user_name, v_user_email;
  
  INSERT INTO affiliate_clicks (
    affiliate_id, user_id, converted, created_at
  )
  SELECT 
    v_jhoncay_affiliate_id,
    v_user_id,
    true,
    p.created_at
  FROM profiles p
  WHERE p.id = v_user_id
  ON CONFLICT DO NOTHING;
  
  SELECT process_affiliate_first_purchase(
    v_user_id,
    v_payment_amount,
    v_transaction_id::text
  ) INTO v_result;
  
  RAISE NOTICE '✅ Resultado: %', v_result;
  
  -- 3. Francisca Érica
  v_user_id := '462a4f52-303c-4da7-9b4a-f853773c25b6';
  v_transaction_id := 'baf67edf-de26-4bc7-b39d-a1c8560b83c8';
  v_payment_amount := 19.99;
  
  SELECT name, email INTO v_user_name, v_user_email
  FROM profiles WHERE id = v_user_id;
  
  RAISE NOTICE '🔄 Processando: % (%)', v_user_name, v_user_email;
  
  INSERT INTO affiliate_clicks (
    affiliate_id, user_id, converted, created_at
  )
  SELECT 
    v_jhoncay_affiliate_id,
    v_user_id,
    true,
    p.created_at
  FROM profiles p
  WHERE p.id = v_user_id
  ON CONFLICT DO NOTHING;
  
  SELECT process_affiliate_first_purchase(
    v_user_id,
    v_payment_amount,
    v_transaction_id::text
  ) INTO v_result;
  
  RAISE NOTICE '✅ Resultado: %', v_result;
  
  RAISE NOTICE '🎉 Processamento de comissões retroativas concluído!';
END $$;