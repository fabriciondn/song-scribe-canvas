
-- Trigger para conceder acordes ao afiliado quando uma comissão é criada (indicação com compra)
CREATE OR REPLACE FUNCTION public.trigger_acordes_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_affiliate_user_id UUID;
BEGIN
  -- Buscar o user_id do afiliado
  SELECT user_id INTO v_affiliate_user_id
  FROM affiliates
  WHERE id = NEW.affiliate_id;
  
  IF v_affiliate_user_id IS NOT NULL THEN
    -- Conceder acordes ao afiliado
    PERFORM grant_acordes(
      v_affiliate_user_id, 
      'refer_friend_purchase', 
      NEW.id, 
      'Indicação convertida em compra'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela de comissões
DROP TRIGGER IF EXISTS on_affiliate_commission_created ON public.affiliate_commissions;
CREATE TRIGGER on_affiliate_commission_created
  AFTER INSERT ON public.affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_acordes_affiliate_commission();
