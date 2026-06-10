
ALTER TABLE public.music_preview_orders
  ADD COLUMN IF NOT EXISTS includes_registration boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.create_music_preview_order(
  p_token text, p_track_ids uuid[], p_includes_registration boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  v_amount := 49.99 + CASE WHEN COALESCE(p_includes_registration,false) THEN 19.99 ELSE 0 END;
  INSERT INTO public.music_preview_orders (preview_id, selected_track_ids, amount, status, includes_registration)
  VALUES (v_preview_id, p_track_ids, v_amount, 'pending', COALESCE(p_includes_registration,false))
  RETURNING id INTO v_order_id;
  RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'amount', v_amount);
END; $$;
GRANT EXECUTE ON FUNCTION public.create_music_preview_order(text, uuid[], boolean) TO anon, authenticated;
