
-- Adicionar contatobelinhalisboa como indicado de jhonccompositor
UPDATE profiles
SET moderator_notes = 'Indicado por: compuse-67b9f052-efda-43a2-ac72-c9cc1b5f7a09-jhoncay'
WHERE email = 'contatobelinhalisboa@hotmail.com';

-- Adicionar os outros usuários como indicados de sandropopcompositor
UPDATE profiles
SET moderator_notes = 'Indicado por: compuse-7a3db71d-bcdc-4238-880f-775ed11d5124-sandropop'
WHERE email IN (
  'naldosilvaoferinha@gmail.com',
  'premier.midia01@gmail.com',
  'jrdcastro29@gmail.com',
  'matheuszuugel@gmail.com',
  'chal.lima23@gmail.com',
  'jsmarrony@yahoo.com.br',
  'joaobatistadelima1976@gmail.com',
  'djlukinha1997@gmail.com'
);

-- Criar cliques convertidos para rastreamento do jhonccompositor
INSERT INTO affiliate_clicks (affiliate_id, user_id, converted, created_at)
SELECT 
  '53d044fb-6407-47f4-987e-eb80ec7109a6'::uuid,
  id,
  true,
  NOW()
FROM profiles
WHERE email = 'contatobelinhalisboa@hotmail.com';

-- Criar cliques convertidos para rastreamento do sandropopcompositor
INSERT INTO affiliate_clicks (affiliate_id, user_id, converted, created_at)
SELECT 
  '5b159b12-f5ff-4659-b86b-d39cf939cf2f'::uuid,
  id,
  true,
  NOW()
FROM profiles
WHERE email IN (
  'naldosilvaoferinha@gmail.com',
  'premier.midia01@gmail.com',
  'jrdcastro29@gmail.com',
  'matheuszuugel@gmail.com',
  'chal.lima23@gmail.com',
  'jsmarrony@yahoo.com.br',
  'joaobatistadelima1976@gmail.com',
  'djlukinha1997@gmail.com'
)
AND NOT EXISTS (
  SELECT 1 FROM affiliate_clicks ac
  WHERE ac.affiliate_id = '5b159b12-f5ff-4659-b86b-d39cf939cf2f'::uuid
  AND ac.user_id = profiles.id
);

-- Incrementar total_registrations do jhonccompositor (1 usuário)
UPDATE affiliates
SET total_registrations = total_registrations + 1,
    updated_at = NOW()
WHERE id = '53d044fb-6407-47f4-987e-eb80ec7109a6';

-- Incrementar total_registrations do sandropopcompositor (8 usuários novos)
-- dyttobyspo e layandravictoria já estavam como indicados dele
UPDATE affiliates
SET total_registrations = total_registrations + 8,
    updated_at = NOW()
WHERE id = '5b159b12-f5ff-4659-b86b-d39cf939cf2f';

-- Remover qualquer comissão pendente desses usuários que não registraram obras
DELETE FROM affiliate_commissions
WHERE user_id IN (
  SELECT id FROM profiles WHERE email IN (
    'contatobelinhalisboa@hotmail.com',
    'dyttobyspo@gmail.com',
    'naldosilvaoferinha@gmail.com',
    'layandravictoriaoficial@gmail.com',
    'premier.midia01@gmail.com',
    'jrdcastro29@gmail.com',
    'matheuszuugel@gmail.com',
    'chal.lima23@gmail.com',
    'jsmarrony@yahoo.com.br',
    'joaobatistadelima1976@gmail.com',
    'djlukinha1997@gmail.com'
  )
);
