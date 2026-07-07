CREATE OR REPLACE FUNCTION public.moderator_update_user_credits(target_user_id uuid, new_credits integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  old_credits_value integer;
  moderator_credits integer;
  credit_difference integer;
  acting_moderator_id uuid;
  is_admin boolean;
BEGIN
  -- Verificar se caller é admin/super_admin
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  ) INTO is_admin;

  IF is_admin THEN
    -- Admin agindo em nome do moderador dono do usuário
    SELECT moderator_id INTO acting_moderator_id
    FROM public.moderator_users
    WHERE user_id = target_user_id
    LIMIT 1;

    IF acting_moderator_id IS NULL THEN
      RAISE EXCEPTION 'This user is not managed by any moderator.';
    END IF;
  ELSE
    -- Precisa ser moderador
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
        AND role = 'moderator'
    ) THEN
      RAISE EXCEPTION 'Access denied. Moderator privileges required.';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.moderator_users
      WHERE user_id = target_user_id
        AND moderator_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'You can only manage credits for users you have created.';
    END IF;

    acting_moderator_id := auth.uid();
  END IF;

  SELECT credits INTO old_credits_value
  FROM public.profiles
  WHERE id = target_user_id;

  credit_difference := new_credits - COALESCE(old_credits_value, 0);

  IF credit_difference > 0 THEN
    SELECT credits INTO moderator_credits
    FROM public.profiles
    WHERE id = acting_moderator_id;

    IF COALESCE(moderator_credits, 0) < credit_difference THEN
      RAISE EXCEPTION 'Insufficient credits. Moderator has % credits but needs % more.', COALESCE(moderator_credits, 0), credit_difference;
    END IF;

    UPDATE public.profiles
    SET credits = credits - credit_difference
    WHERE id = acting_moderator_id;
  ELSIF credit_difference < 0 THEN
    UPDATE public.profiles
    SET credits = credits + ABS(credit_difference)
    WHERE id = acting_moderator_id;
  END IF;

  UPDATE public.profiles
  SET credits = new_credits
  WHERE id = target_user_id;

  INSERT INTO public.user_activity_logs (user_id, action, metadata)
  VALUES (
    target_user_id,
    'credits_updated_by_moderator',
    jsonb_build_object(
      'moderator_user_id', acting_moderator_id,
      'performed_by', auth.uid(),
      'is_admin_impersonation', is_admin,
      'old_credits', old_credits_value,
      'new_credits', new_credits,
      'credit_difference', credit_difference
    )
  );
END;
$function$;