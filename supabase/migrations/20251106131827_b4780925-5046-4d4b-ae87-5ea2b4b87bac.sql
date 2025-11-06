
-- Atualizar layandravictoria com código completo do afiliado
UPDATE profiles
SET moderator_notes = 'Indicado por: compuse-7a3db71d-bcdc-4238-880f-775ed11d5124-sandropop'
WHERE email = 'layandravictoriaoficial@gmail.com';

-- Criar clique convertido para layandravictoria
INSERT INTO affiliate_clicks (affiliate_id, user_id, converted, created_at)
SELECT 
  '5b159b12-f5ff-4659-b86b-d39cf939cf2f'::uuid,
  id,
  true,
  NOW()
FROM profiles
WHERE email = 'layandravictoriaoficial@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM affiliate_clicks ac
  WHERE ac.affiliate_id = '5b159b12-f5ff-4659-b86b-d39cf939cf2f'::uuid
  AND ac.user_id = profiles.id
);

-- Remover qualquer comissão existente do afiliado sandropop (nenhum indicado colocou créditos ainda)
DELETE FROM affiliate_commissions
WHERE affiliate_id = '5b159b12-f5ff-4659-b86b-d39cf939cf2f'::uuid;
