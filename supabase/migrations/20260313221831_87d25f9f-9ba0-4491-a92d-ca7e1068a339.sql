-- Remover dados relacionados à afiliação da Layandra
DELETE FROM affiliate_clicks WHERE affiliate_id = 'e052152f-d4ae-44a5-936e-f779f54b6679';
DELETE FROM affiliate_conversions WHERE affiliate_id = 'e052152f-d4ae-44a5-936e-f779f54b6679';
DELETE FROM affiliate_commissions WHERE affiliate_id = 'e052152f-d4ae-44a5-936e-f779f54b6679';
DELETE FROM affiliate_campaigns WHERE affiliate_id = 'e052152f-d4ae-44a5-936e-f779f54b6679';
DELETE FROM affiliate_achievements WHERE affiliate_id = 'e052152f-d4ae-44a5-936e-f779f54b6679';
DELETE FROM affiliate_withdrawal_requests WHERE affiliate_id = 'e052152f-d4ae-44a5-936e-f779f54b6679';
DELETE FROM affiliate_payouts WHERE affiliate_id = 'e052152f-d4ae-44a5-936e-f779f54b6679';
DELETE FROM affiliates WHERE id = 'e052152f-d4ae-44a5-936e-f779f54b6679';