-- Função para moderador atualizar créditos de usuários que ele criou
CREATE OR REPLACE FUNCTION public.moderator_update_user_credits(target_user_id uuid, new_credits integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  old_credits_value integer;
  moderator_credits integer;
  credit_difference integer;
BEGIN
  -- Verificar se o usuário atual é moderador
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'moderator'
  ) THEN
    RAISE EXCEPTION 'Access denied. Moderator privileges required.';
  END IF;

  -- Verificar se o usuário foi criado por este moderador
  IF NOT EXISTS (
    SELECT 1 FROM public.moderator_users 
    WHERE user_id = target_user_id 
    AND moderator_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You can only manage credits for users you have created.';
  END IF;

  -- Buscar créditos atuais do usuário alvo
  SELECT credits INTO old_credits_value 
  FROM public.profiles 
  WHERE id = target_user_id;

  -- Calcular diferença de créditos
  credit_difference := new_credits - old_credits_value;

  -- Se está aumentando créditos, verificar se moderador tem créditos suficientes
  IF credit_difference > 0 THEN
    SELECT credits INTO moderator_credits 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    IF moderator_credits < credit_difference THEN
      RAISE EXCEPTION 'Insufficient credits. You have % credits but need % more.', moderator_credits, credit_difference;
    END IF;
    
    -- Debitar créditos do moderador
    UPDATE public.profiles 
    SET credits = credits - credit_difference
    WHERE id = auth.uid();
  ELSE
    -- Se está diminuindo créditos, creditar de volta ao moderador
    UPDATE public.profiles 
    SET credits = credits + ABS(credit_difference)
    WHERE id = auth.uid();
  END IF;

  -- Atualizar os créditos do usuário alvo
  UPDATE public.profiles 
  SET credits = new_credits
  WHERE id = target_user_id;

  -- Log da atividade
  INSERT INTO public.user_activity_logs (user_id, action, metadata)
  VALUES (
    target_user_id, 
    'credits_updated_by_moderator', 
    jsonb_build_object(
      'moderator_user_id', auth.uid(),
      'old_credits', old_credits_value,
      'new_credits', new_credits,
      'credit_difference', credit_difference
    )
  );
END;
$function$;