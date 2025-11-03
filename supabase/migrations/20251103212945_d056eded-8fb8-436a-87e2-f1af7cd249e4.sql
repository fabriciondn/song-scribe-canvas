
-- Deletar comissão incorreta da segunda compra
DELETE FROM affiliate_commissions
WHERE id = 'fa17f25d-eaea-4dcb-86ac-9a311bb0a61a';

-- Também remover a conversão relacionada se existir
DELETE FROM affiliate_conversions
WHERE reference_id = '237b4615-625d-4953-b30f-d7389ddb171c';
