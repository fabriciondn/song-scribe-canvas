
CREATE OR REPLACE FUNCTION public.create_music_preview_order(p_token text, p_track_ids uuid[], p_includes_registration boolean DEFAULT false, p_includes_cover boolean DEFAULT false, p_selected_cover_url text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_preview_id uuid;
  v_order_id uuid;
  v_amount numeric(10,2);
BEGIN
  SELECT id INTO v_preview_id FROM public.music_previews WHERE share_token = p_token OR slug = p_token;
  IF v_preview_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;
  IF p_track_ids IS NULL OR array_length(p_track_ids,1) IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_tracks');
  END IF;
  v_amount := 49.99
    + CASE WHEN COALESCE(p_includes_registration,false) THEN 29.90 ELSE 0 END
    + CASE WHEN COALESCE(p_includes_cover,false) THEN 4.99 ELSE 0 END;
  INSERT INTO public.music_preview_orders (
    preview_id, selected_track_ids, amount, status,
    includes_registration, includes_cover, selected_cover_url
  )
  VALUES (
    v_preview_id, p_track_ids, v_amount, 'pending',
    COALESCE(p_includes_registration,false),
    COALESCE(p_includes_cover,false),
    CASE WHEN COALESCE(p_includes_cover,false) THEN p_selected_cover_url ELSE NULL END
  )
  RETURNING id INTO v_order_id;
  RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'amount', v_amount);
END; $function$;

CREATE OR REPLACE FUNCTION public.process_affiliate_conversion(p_affiliate_code text, p_user_id uuid, p_type commission_type, p_reference_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_affiliate affiliates%ROWTYPE;
  v_commission_rate DECIMAL;
  v_commission_amount DECIMAL;
  v_active_subscriptions INTEGER;
  v_registration_price DECIMAL := 29.90;
  v_subscription_price DECIMAL := 15.00;
  v_commission_id UUID;
BEGIN
  SELECT * INTO v_affiliate
  FROM public.affiliates
  WHERE affiliate_code = p_affiliate_code AND status = 'approved';
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  IF p_type = 'author_registration' THEN
    IF v_affiliate.total_registrations < 5 THEN
      v_commission_rate := 25.0;
      v_commission_amount := p_amount * 0.25;
    ELSE
      v_commission_rate := 50.0;
      v_commission_amount := p_amount * 0.50;
    END IF;
  ELSIF p_type = 'subscription_recurring' THEN
    IF v_affiliate.level = 'gold' THEN
      SELECT COUNT(*) INTO v_active_subscriptions
      FROM public.affiliate_commissions
      WHERE affiliate_id = v_affiliate.id
        AND type = 'subscription_recurring'
        AND status = 'paid';
      IF v_active_subscriptions < 10 THEN
        v_commission_rate := 25.0;
        v_commission_amount := v_subscription_price * 0.25;
      ELSE
        v_commission_rate := 50.0;
        v_commission_amount := v_subscription_price * 0.50;
      END IF;
    ELSE
      RETURN FALSE;
    END IF;
  END IF;
  INSERT INTO public.affiliate_commissions (
    affiliate_id, user_id, type, reference_id, amount, commission_rate
  ) VALUES (
    v_affiliate.id, p_user_id, p_type, p_reference_id, v_commission_amount, v_commission_rate
  ) RETURNING id INTO v_commission_id;
  INSERT INTO public.affiliate_conversions (
    affiliate_id, user_id, type, reference_id, commission_id
  ) VALUES (
    v_affiliate.id, p_user_id, p_type, p_reference_id, v_commission_id
  );
  IF p_type = 'author_registration' THEN
    UPDATE public.affiliates 
    SET total_registrations = total_registrations + 1,
        total_earnings = total_earnings + v_commission_amount
    WHERE id = v_affiliate.id;
  ELSIF p_type = 'subscription_recurring' THEN
    UPDATE public.affiliates 
    SET total_subscriptions = total_subscriptions + 1,
        total_earnings = total_earnings + v_commission_amount
    WHERE id = v_affiliate.id;
  END IF;
  PERFORM public.check_affiliate_level_upgrade(v_affiliate.id);
  RETURN TRUE;
END;
$function$;
