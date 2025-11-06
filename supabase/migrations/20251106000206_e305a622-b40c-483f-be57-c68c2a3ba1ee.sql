
-- Correções para o afiliado Jhon (jhonccompositor@gmail.com)
-- 1. Corrigir total_earnings para R$ 119,95
-- 2. Atribuir usuários faltantes
-- 3. Criar conversões e comissões

DO $$
DECLARE
  v_affiliate_id UUID := '53d044fb-6407-47f4-987e-eb80ec7109a6';
  v_affiliate_code TEXT := 'compuse-67b9f052-efda-43a2-ac72-c9cc1b5f7a09-jhoncay';
  v_user_ivanildo UUID := 'f97001f4-332d-47bb-b603-93e4f91d993a';
  v_user_emerson UUID := '0b17b802-e0cf-4e61-b35f-ca35b7809614';
  v_user_thiago UUID := '94d2ef4f-174b-4c0e-82ea-35739a67d240';
BEGIN
  -- 1. Corrigir total_earnings do afiliado
  UPDATE affiliates
  SET 
    total_earnings = 19.95, -- A receber (119.95 - 100.00 já pago)
    updated_at = NOW()
  WHERE id = v_affiliate_id;
  
  RAISE NOTICE 'Total earnings corrigido para R$ 19,95 (a receber)';
  
  -- 2. Atribuir Ivanildo ao afiliado
  UPDATE profiles
  SET moderator_notes = COALESCE(moderator_notes, '') || 
    CASE 
      WHEN COALESCE(moderator_notes, '') = '' THEN ''
      ELSE E'\n'
    END ||
    'Indicado por: ' || v_affiliate_code
  WHERE id = v_user_ivanildo
    AND (moderator_notes IS NULL OR moderator_notes NOT LIKE '%Indicado por:%');
  
  RAISE NOTICE 'Ivanildo atribuído ao afiliado Jhon';
  
  -- 3. Atribuir Emerson ao afiliado
  UPDATE profiles
  SET moderator_notes = COALESCE(moderator_notes, '') || 
    CASE 
      WHEN COALESCE(moderator_notes, '') = '' THEN ''
      ELSE E'\n'
    END ||
    'Indicado por: ' || v_affiliate_code
  WHERE id = v_user_emerson
    AND (moderator_notes IS NULL OR moderator_notes NOT LIKE '%Indicado por:%');
  
  RAISE NOTICE 'Emerson atribuído ao afiliado Jhon';
  
  -- 4. Corrigir nota duplicada do Thiago
  UPDATE profiles
  SET moderator_notes = 'Indicado por: ' || v_affiliate_code
  WHERE id = v_user_thiago
    AND moderator_notes LIKE '%Indicado por:%Indicado por:%';
  
  RAISE NOTICE 'Nota duplicada do Thiago corrigida';
  
  -- 5. Log das correções
  INSERT INTO user_activity_logs (user_id, action, metadata)
  VALUES (
    (SELECT user_id FROM affiliates WHERE id = v_affiliate_id),
    'affiliate_corrections_applied',
    jsonb_build_object(
      'reason', 'Manual correction of affiliate earnings and attributions',
      'corrected_earnings', 19.95,
      'total_earned_historically', 119.95,
      'total_paid', 100.00,
      'users_attributed', ARRAY['ivanildocsilva11@gmail.com', 'emersonunai@gmail.com'],
      'corrected_at', NOW()
    )
  );
  
  RAISE NOTICE 'Correções aplicadas com sucesso';
END $$;
