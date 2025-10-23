-- Adicionar campo approved_by para rastrear quem aprovou
ALTER TABLE affiliate_withdrawal_requests 
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id);

-- Habilitar Realtime na tabela
ALTER TABLE affiliate_withdrawal_requests REPLICA IDENTITY FULL;

-- Adicionar à publicação realtime se não estiver
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'affiliate_withdrawal_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE affiliate_withdrawal_requests;
  END IF;
END $$;

-- Criar função para processar pagamento completo
CREATE OR REPLACE FUNCTION process_affiliate_withdrawal_payment(
  p_withdrawal_id uuid,
  p_admin_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id uuid;
  v_amount numeric;
BEGIN
  -- Verificar se admin tem permissão
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = p_admin_id
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem processar pagamentos';
  END IF;

  -- Buscar dados da solicitação
  SELECT affiliate_id, amount 
  INTO v_affiliate_id, v_amount
  FROM affiliate_withdrawal_requests
  WHERE id = p_withdrawal_id AND status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou não aprovada';
  END IF;

  -- Verificar se afiliado tem saldo suficiente
  IF NOT EXISTS (
    SELECT 1 FROM affiliates 
    WHERE id = v_affiliate_id 
    AND total_earnings >= v_amount
  ) THEN
    RAISE EXCEPTION 'Saldo insuficiente do afiliado';
  END IF;

  -- Atualizar status da solicitação
  UPDATE affiliate_withdrawal_requests
  SET 
    status = 'paid',
    processed_at = NOW(),
    processed_by = p_admin_id,
    updated_at = NOW()
  WHERE id = p_withdrawal_id;

  -- Deduzir do saldo disponível e adicionar ao total pago
  UPDATE affiliates
  SET 
    total_paid = total_paid + v_amount,
    total_earnings = total_earnings - v_amount,
    updated_at = NOW()
  WHERE id = v_affiliate_id;

  RETURN true;
END;
$$;

-- Criar RLS policy para admins gerenciarem solicitações
DROP POLICY IF EXISTS "Admins can manage all withdrawal requests" ON affiliate_withdrawal_requests;
CREATE POLICY "Admins can manage all withdrawal requests"
ON affiliate_withdrawal_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);