
-- Corrigir atribuição incorreta de afiliado para dudumateus223@gmail.com
-- Usuário criado em 11/10/2025, afiliado criado em 22/10/2025 (impossível)

DO $$
DECLARE
  v_user_id UUID := '795cf06b-677d-4b2f-b06d-7227a6b3c57e';
  v_affiliate_id UUID := '5b159b12-f5ff-4659-b86b-d39cf939cf2f';
  v_total_commission NUMERIC := 24.00; -- 4 comissões de R$ 6,00
  v_total_registrations INTEGER := 4;
BEGIN
  -- 1. Deletar comissões incorretas
  DELETE FROM affiliate_commissions
  WHERE user_id = v_user_id 
    AND affiliate_id = v_affiliate_id;
  
  RAISE NOTICE 'Comissões deletadas: 4 (R$ 24.00 total)';
  
  -- 2. Deletar conversão incorreta
  DELETE FROM affiliate_conversions
  WHERE user_id = v_user_id 
    AND affiliate_id = v_affiliate_id;
  
  RAISE NOTICE 'Conversão deletada';
  
  -- 3. Atualizar estatísticas do afiliado
  UPDATE affiliates
  SET 
    total_registrations = GREATEST(total_registrations - v_total_registrations, 0),
    total_earnings = GREATEST(total_earnings - v_total_commission, 0),
    total_paid = GREATEST(total_paid - v_total_commission, 0),
    updated_at = NOW()
  WHERE id = v_affiliate_id;
  
  RAISE NOTICE 'Estatísticas do afiliado atualizadas';
  
  -- 4. Remover nota de indicação do perfil do usuário
  UPDATE profiles
  SET moderator_notes = REGEXP_REPLACE(
    moderator_notes, 
    'Indicado por:\s*compuse-[^\n]+\n?', 
    '', 
    'g'
  )
  WHERE id = v_user_id
    AND moderator_notes LIKE '%Indicado por:%';
  
  RAISE NOTICE 'Nota de indicação removida do perfil';
  
  -- 5. Log da correção
  INSERT INTO user_activity_logs (user_id, action, metadata)
  VALUES (
    v_user_id,
    'affiliate_attribution_corrected',
    jsonb_build_object(
      'reason', 'User created before affiliate existed',
      'user_created_at', '2025-10-11',
      'affiliate_created_at', '2025-10-22',
      'removed_commissions', v_total_commission,
      'removed_registrations', v_total_registrations,
      'corrected_at', NOW()
    )
  );
  
  RAISE NOTICE 'Correção concluída com sucesso';
END $$;
