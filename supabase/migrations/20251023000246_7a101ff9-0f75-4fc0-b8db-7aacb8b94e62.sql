
-- Criar comissão manualmente para thiagorosaaa01@icloud.com

-- Inserir comissão diretamente
INSERT INTO affiliate_commissions (
  affiliate_id,
  user_id,
  type,
  reference_id,
  amount,
  commission_rate,
  status
) VALUES (
  '53d044fb-6407-47f4-987e-eb80ec7109a6'::uuid, -- ID do afiliado jhonccompositor
  '94d2ef4f-174b-4c0e-82ea-35739a67d240'::uuid, -- ID do usuário thiagorosaaa01
  'author_registration',
  '6c33b178-0036-409e-9cca-01e3bfa9e17e'::uuid, -- ID da transação
  9.995, -- 50% de 19.99 (usando taxa personalizada de 50%)
  50.00, -- Taxa de comissão de 50%
  'pending'
)
ON CONFLICT DO NOTHING;

-- Atualizar estatísticas do afiliado
UPDATE affiliates
SET 
  total_earnings = total_earnings + 9.995,
  total_registrations = total_registrations + 1,
  updated_at = NOW()
WHERE id = '53d044fb-6407-47f4-987e-eb80ec7109a6';

-- Criar conversão
INSERT INTO affiliate_conversions (
  affiliate_id,
  user_id,
  type,
  reference_id
) VALUES (
  '53d044fb-6407-47f4-987e-eb80ec7109a6'::uuid,
  '94d2ef4f-174b-4c0e-82ea-35739a67d240'::uuid,
  'author_registration',
  '6c33b178-0036-409e-9cca-01e3bfa9e17e'::uuid
)
ON CONFLICT DO NOTHING;
