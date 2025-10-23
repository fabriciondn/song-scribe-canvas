
-- Correção manual: Adicionar código de afiliado e processar comissão para thiagorosaaa01@icloud.com

-- 1. Adicionar código de afiliado no perfil do usuário
UPDATE profiles
SET moderator_notes = COALESCE(moderator_notes || E'\n', '') || 'Indicado por: compuse-67b9f052-efda-43a2-ac72-c9cc1b5f7a09-jhoncay'
WHERE email = 'thiagorosaaa01@icloud.com' 
AND id = '94d2ef4f-174b-4c0e-82ea-35739a67d240';

-- 2. Processar comissão manualmente usando a RPC function
SELECT process_affiliate_first_purchase(
  '94d2ef4f-174b-4c0e-82ea-35739a67d240'::uuid,
  19.99,
  '6c33b178-0036-409e-9cca-01e3bfa9e17e'::text
);
