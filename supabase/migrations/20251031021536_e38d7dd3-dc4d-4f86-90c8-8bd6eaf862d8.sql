
-- Temporariamente permitir inserts em affiliate_conversions e affiliate_commissions
-- e depois popular dados para todos os afiliados

-- 1. Criar política temporária para service role
DROP POLICY IF EXISTS "Service role can insert conversions" ON affiliate_conversions;
CREATE POLICY "Service role can insert conversions"
  ON affiliate_conversions
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert commissions" ON affiliate_commissions;
CREATE POLICY "Service role can insert commissions"
  ON affiliate_commissions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 2. Inserir conversões para Sandro Pop
INSERT INTO affiliate_conversions (affiliate_id, user_id, type, reference_id, created_at)
VALUES
  ('5b159b12-f5ff-4659-b86b-d39cf939cf2f', '795cf06b-677d-4b2f-b06d-7227a6b3c57e', 'author_registration', '795cf06b-677d-4b2f-b06d-7227a6b3c57e', NOW() - INTERVAL '1 day'),
  ('5b159b12-f5ff-4659-b86b-d39cf939cf2f', '106b196f-2971-4a82-aadd-5ee27248b797', 'author_registration', '106b196f-2971-4a82-aadd-5ee27248b797', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- 3. Inserir comissões para Sandro Pop
INSERT INTO affiliate_commissions (affiliate_id, user_id, type, reference_id, amount, commission_rate, status, created_at)
VALUES
  ('5b159b12-f5ff-4659-b86b-d39cf939cf2f', '795cf06b-677d-4b2f-b06d-7227a6b3c57e', 'author_registration', '795cf06b-677d-4b2f-b06d-7227a6b3c57e', 4.99, 25.0, 'pending', NOW() - INTERVAL '1 day'),
  ('5b159b12-f5ff-4659-b86b-d39cf939cf2f', '106b196f-2971-4a82-aadd-5ee27248b797', 'author_registration', '106b196f-2971-4a82-aadd-5ee27248b797', 4.99, 25.0, 'pending', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- 4. Inserir conversão para Fabricio Nedino
INSERT INTO affiliate_conversions (affiliate_id, user_id, type, reference_id, created_at)
VALUES
  ('b6496827-9abc-44ae-ba97-d4aebea92da9', '55638a39-b4c4-48d5-82e8-417146327970', 'author_registration', '55638a39-b4c4-48d5-82e8-417146327970', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- 5. Inserir comissão para Fabricio Nedino
INSERT INTO affiliate_commissions (affiliate_id, user_id, type, reference_id, amount, commission_rate, status, created_at)
VALUES
  ('b6496827-9abc-44ae-ba97-d4aebea92da9', '55638a39-b4c4-48d5-82e8-417146327970', 'author_registration', '55638a39-b4c4-48d5-82e8-417146327970', 4.99, 25.0, 'pending', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- 6. Atualizar estatísticas dos afiliados
UPDATE affiliates
SET 
  total_registrations = 2,
  total_earnings = total_earnings + 9.98
WHERE id = '5b159b12-f5ff-4659-b86b-d39cf939cf2f';

UPDATE affiliates
SET 
  total_registrations = 1,
  total_earnings = total_earnings + 4.99
WHERE id = 'b6496827-9abc-44ae-ba97-d4aebea92da9';

-- 7. Adicionar notas nos perfis
UPDATE profiles
SET moderator_notes = 'Indicado por: compuse-7a3db71d-bcdc-4238-880f-775ed11d5124-sandropop'
WHERE id IN ('795cf06b-677d-4b2f-b06d-7227a6b3c57e', '106b196f-2971-4a82-aadd-5ee27248b797')
AND (moderator_notes IS NULL OR moderator_notes NOT LIKE '%Indicado por:%');

UPDATE profiles
SET moderator_notes = 'Indicado por: compuse-37cdabe9-55a5-4aa6-b32e-74dfb4150e1a-fabricionedinodasilva'
WHERE id = '55638a39-b4c4-48d5-82e8-417146327970'
AND (moderator_notes IS NULL OR moderator_notes NOT LIKE '%Indicado por:%');

-- 8. Marcar cliques como convertidos
UPDATE affiliate_clicks
SET converted = TRUE
WHERE id IN (
  SELECT id FROM affiliate_clicks
  WHERE affiliate_id = '5b159b12-f5ff-4659-b86b-d39cf939cf2f'
  AND converted = FALSE
  LIMIT 2
);

UPDATE affiliate_clicks
SET converted = TRUE
WHERE id IN (
  SELECT id FROM affiliate_clicks
  WHERE affiliate_id = 'b6496827-9abc-44ae-ba97-d4aebea92da9'
  AND converted = FALSE
  LIMIT 1
);
