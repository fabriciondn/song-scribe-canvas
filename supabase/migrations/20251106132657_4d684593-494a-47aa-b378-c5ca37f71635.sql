-- Remove todas as comissões do afiliado sandropopcompositor@gmail.com
-- pois nenhum indicado ainda colocou créditos na plataforma

DELETE FROM affiliate_commissions
WHERE affiliate_id IN (
  SELECT a.id 
  FROM affiliates a
  JOIN profiles p ON a.user_id = p.id
  WHERE p.email = 'sandropopcompositor@gmail.com'
);