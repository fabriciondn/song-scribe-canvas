-- PARTE 1: Adicionar coluna user_id à tabela affiliate_clicks
ALTER TABLE affiliate_clicks 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user_id ON affiliate_clicks(user_id);

-- PARTE 2: Criar cliques retroativos para ADILTON (ID correto)
INSERT INTO affiliate_clicks (
  affiliate_id,
  user_id,
  converted,
  created_at,
  ip_address,
  referrer
) VALUES (
  '5b159b12-f5ff-4659-b86b-d39cf939cf2f', -- Sandro Pop
  '5acf6608-d695-477c-add5-8d6bb51fcaef', -- ADILTON (ID correto)
  true,
  COALESCE((SELECT created_at FROM profiles WHERE id = '5acf6608-d695-477c-add5-8d6bb51fcaef'), NOW()),
  '127.0.0.1'::inet,
  'affiliate_link'
);

-- Criar clique retroativo para LAYANDRA
INSERT INTO affiliate_clicks (
  affiliate_id,
  user_id,
  converted,
  created_at,
  ip_address,
  referrer
) VALUES (
  '5b159b12-f5ff-4659-b86b-d39cf939cf2f', -- Sandro Pop
  '7f7d59d5-45ee-4460-ab73-19a9b76795bd', -- LAYANDRA
  true,
  COALESCE((SELECT created_at FROM profiles WHERE id = '7f7d59d5-45ee-4460-ab73-19a9b76795bd'), NOW()),
  '127.0.0.1'::inet,
  'affiliate_link'
);

-- PARTE 3: Criar clique retroativo para José Eduardo
INSERT INTO affiliate_clicks (
  affiliate_id,
  user_id,
  converted,
  created_at,
  ip_address,
  referrer
) VALUES (
  '5b159b12-f5ff-4659-b86b-d39cf939cf2f', -- Sandro Pop
  '795cf06b-677d-4b2f-b06d-7227a6b3c57e', -- José Eduardo
  true,
  '2025-10-11 12:00:00'::timestamptz,
  '127.0.0.1'::inet,
  'affiliate_link'
);

-- Adicionar notas nos perfis de ADILTON e LAYANDRA
UPDATE profiles 
SET moderator_notes = 'Indicado por: compuse-sandropop'
WHERE id IN (
  '5acf6608-d695-477c-add5-8d6bb51fcaef',
  '7f7d59d5-45ee-4460-ab73-19a9b76795bd'
);

-- PARTE 5: Remover José Rubens (não veio pelo link)
UPDATE profiles 
SET moderator_notes = ''
WHERE id = '106b196f-2971-4a82-aadd-5ee27248b797';

-- Garantir que não há cliques dele
DELETE FROM affiliate_clicks
WHERE user_id = '106b196f-2971-4a82-aadd-5ee27248b797'
AND affiliate_id = '5b159b12-f5ff-4659-b86b-d39cf939cf2f';

-- PARTE 6: Processar comissões de José Eduardo (4 obras × R$ 19,99 × 30% comissão)
DO $$
DECLARE
  jose_click_id UUID;
  sandro_affiliate_id UUID := '5b159b12-f5ff-4659-b86b-d39cf939cf2f';
  jose_user_id UUID := '795cf06b-677d-4b2f-b06d-7227a6b3c57e';
  commission_rate NUMERIC := 0.30;
  obra_price NUMERIC := 19.99;
BEGIN
  -- Buscar o click_id do José Eduardo
  SELECT id INTO jose_click_id
  FROM affiliate_clicks
  WHERE user_id = jose_user_id
  AND affiliate_id = sandro_affiliate_id
  LIMIT 1;

  -- Obra 1: PASSANDO NA ESCURIDÃO
  INSERT INTO affiliate_conversions (
    affiliate_id,
    user_id,
    type,
    reference_id,
    click_id,
    created_at
  ) VALUES (
    sandro_affiliate_id,
    jose_user_id,
    'author_registration',
    '2d4ea1e7-cdab-449c-bdc6-da73baf48e0a',
    jose_click_id,
    '2025-10-11 12:35:18.205666+00'::timestamptz
  );

  INSERT INTO affiliate_commissions (
    affiliate_id,
    user_id,
    type,
    reference_id,
    amount,
    commission_rate,
    status,
    created_at
  ) VALUES (
    sandro_affiliate_id,
    jose_user_id,
    'author_registration',
    '2d4ea1e7-cdab-449c-bdc6-da73baf48e0a',
    obra_price * commission_rate,
    commission_rate,
    'paid',
    '2025-10-11 12:35:18.205666+00'::timestamptz
  );

  -- Obra 2: TÔ APAIXONADO POR ELA
  INSERT INTO affiliate_conversions (
    affiliate_id,
    user_id,
    type,
    reference_id,
    click_id,
    created_at
  ) VALUES (
    sandro_affiliate_id,
    jose_user_id,
    'author_registration',
    'ff6bc2b3-df01-469b-bafe-50e9ff7c128d',
    jose_click_id,
    '2025-10-11 12:45:11.169909+00'::timestamptz
  );

  INSERT INTO affiliate_commissions (
    affiliate_id,
    user_id,
    type,
    reference_id,
    amount,
    commission_rate,
    status,
    created_at
  ) VALUES (
    sandro_affiliate_id,
    jose_user_id,
    'author_registration',
    'ff6bc2b3-df01-469b-bafe-50e9ff7c128d',
    obra_price * commission_rate,
    commission_rate,
    'paid',
    '2025-10-11 12:45:11.169909+00'::timestamptz
  );

  -- Obra 3: ANTES DO SOL SUMIR
  INSERT INTO affiliate_conversions (
    affiliate_id,
    user_id,
    type,
    reference_id,
    click_id,
    created_at
  ) VALUES (
    sandro_affiliate_id,
    jose_user_id,
    'author_registration',
    'cbd8f0d4-0bed-4f79-a4bc-19100e6d0beb',
    jose_click_id,
    '2025-10-15 21:38:18.173406+00'::timestamptz
  );

  INSERT INTO affiliate_commissions (
    affiliate_id,
    user_id,
    type,
    reference_id,
    amount,
    commission_rate,
    status,
    created_at
  ) VALUES (
    sandro_affiliate_id,
    jose_user_id,
    'author_registration',
    'cbd8f0d4-0bed-4f79-a4bc-19100e6d0beb',
    obra_price * commission_rate,
    commission_rate,
    'paid',
    '2025-10-15 21:38:18.173406+00'::timestamptz
  );

  -- Obra 4: NOS BARES E NAS CALÇADAS
  INSERT INTO affiliate_conversions (
    affiliate_id,
    user_id,
    type,
    reference_id,
    click_id,
    created_at
  ) VALUES (
    sandro_affiliate_id,
    jose_user_id,
    'author_registration',
    '3d885145-6af2-4ef9-86b2-9ee4309eb2e1',
    jose_click_id,
    '2025-10-24 15:58:31.190745+00'::timestamptz
  );

  INSERT INTO affiliate_commissions (
    affiliate_id,
    user_id,
    type,
    reference_id,
    amount,
    commission_rate,
    status,
    created_at
  ) VALUES (
    sandro_affiliate_id,
    jose_user_id,
    'author_registration',
    '3d885145-6af2-4ef9-86b2-9ee4309eb2e1',
    obra_price * commission_rate,
    commission_rate,
    'paid',
    '2025-10-24 15:58:31.190745+00'::timestamptz
  );

  -- Atualizar total_earnings do Sandro Pop
  UPDATE affiliates
  SET 
    total_earnings = total_earnings + (4 * obra_price * commission_rate),
    total_registrations = total_registrations + 3, -- José Eduardo, ADILTON, LAYANDRA
    updated_at = now()
  WHERE id = sandro_affiliate_id;
END $$;