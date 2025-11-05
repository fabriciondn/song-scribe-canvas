-- 1. Criar tabela temporária com apenas conversões únicas
CREATE TEMP TABLE unique_conversions AS
SELECT DISTINCT ON (user_id, affiliate_id) 
  id, affiliate_id, user_id, click_id, type, reference_id, created_at
FROM affiliate_conversions
ORDER BY user_id, affiliate_id, created_at ASC;

-- 2. Deletar todas as conversões
DELETE FROM affiliate_conversions;

-- 3. Reinserir apenas as únicas
INSERT INTO affiliate_conversions (id, affiliate_id, user_id, click_id, type, reference_id, created_at)
SELECT id, affiliate_id, user_id, click_id, type, reference_id, created_at
FROM unique_conversions;

-- 4. Adicionar constraint única para evitar duplicações futuras
ALTER TABLE affiliate_conversions
ADD CONSTRAINT unique_user_affiliate_conversion 
UNIQUE (user_id, affiliate_id);

-- 5. Comentário explicativo
COMMENT ON CONSTRAINT unique_user_affiliate_conversion ON affiliate_conversions IS 
'Garante que um usuário só pode ter uma conversão por afiliado, evitando duplicações';
