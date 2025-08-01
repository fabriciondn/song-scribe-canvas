-- Corrigir função para não referenciar coluna updated_at que não existe
CREATE OR REPLACE FUNCTION public.admin_update_user_credits(
  target_user_id uuid,
  new_credits integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  old_credits_value integer;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Buscar créditos atuais antes da atualização
  SELECT credits INTO old_credits_value 
  FROM public.profiles 
  WHERE id = target_user_id;

  -- Atualizar os créditos do usuário alvo (sem updated_at)
  UPDATE public.profiles 
  SET credits = new_credits
  WHERE id = target_user_id;

  -- Log da atividade
  INSERT INTO public.user_activity_logs (user_id, action, metadata)
  VALUES (
    target_user_id, 
    'credits_updated_by_admin', 
    jsonb_build_object(
      'admin_user_id', auth.uid(),
      'old_credits', old_credits_value,
      'new_credits', new_credits
    )
  );
END;
$$;