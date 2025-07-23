-- Criar função para decrementar crédito do usuário
CREATE OR REPLACE FUNCTION public.decrement_user_credit(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET credits = GREATEST(credits - 1, 0)
  WHERE id = user_id;
END;
$$;