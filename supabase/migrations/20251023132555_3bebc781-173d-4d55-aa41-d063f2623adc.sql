-- Atualizar saque do jhonccompositor para status "paid"
UPDATE affiliate_withdrawal_requests
SET 
  status = 'paid',
  processed_at = NOW(),
  processed_by = 'bf2d4867-311e-46a6-b428-20618dbcd7dd', -- ID do admin atual
  updated_at = NOW()
WHERE id = '18e6feab-1af5-49a9-a748-28bb9d463a24';

-- Atualizar saldo do afiliado (deduzir 100 do total_earnings e adicionar ao total_paid)
UPDATE affiliates
SET 
  total_earnings = GREATEST(total_earnings - 100, 0),
  total_paid = total_paid + 100,
  updated_at = NOW()
WHERE id = '53d044fb-6407-47f4-987e-eb80ec7109a6';