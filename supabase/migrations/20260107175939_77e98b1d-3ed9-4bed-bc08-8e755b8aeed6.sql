-- Alterar função freeze_bonus_credits para expirar em 30 dias (em vez de 2 meses)
CREATE OR REPLACE FUNCTION public.freeze_bonus_credits(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE subscription_credits_bonus
  SET 
    is_frozen = true,
    frozen_at = NOW(),
    expires_at = NOW() + INTERVAL '30 days',
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND is_frozen = false
    AND credits > 0;
  
  -- Log da atividade
  INSERT INTO user_activity_logs (user_id, action, metadata)
  VALUES (
    p_user_id,
    'bonus_credits_frozen',
    jsonb_build_object(
      'frozen_at', NOW(),
      'expires_at', NOW() + INTERVAL '30 days'
    )
  );
END;
$function$;