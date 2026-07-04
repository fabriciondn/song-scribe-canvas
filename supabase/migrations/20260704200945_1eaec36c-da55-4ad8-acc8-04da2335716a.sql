
ALTER TABLE public.music_preview_orders
  ADD COLUMN IF NOT EXISTS includes_cover boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS selected_cover_url text;

DROP FUNCTION IF EXISTS public.create_music_preview_order(text, uuid[], boolean);

CREATE OR REPLACE FUNCTION public.create_music_preview_order(
  p_token text,
  p_track_ids uuid[],
  p_includes_registration boolean DEFAULT false,
  p_includes_cover boolean DEFAULT false,
  p_selected_cover_url text DEFAULT NULL
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
  v_amount := 49.99
    + CASE WHEN COALESCE(p_includes_registration,false) THEN 19.99 ELSE 0 END
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
END; $$;

GRANT EXECUTE ON FUNCTION public.create_music_preview_order(text, uuid[], boolean, boolean, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_music_preview_order(p_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', o.id, 'status', o.status, 'amount', o.amount, 'paid_at', o.paid_at,
    'pix_qr_code', o.pix_qr_code, 'pix_br_code', o.pix_br_code, 'payment_url', o.payment_url,
    'selected_track_ids', o.selected_track_ids,
    'includes_registration', o.includes_registration,
    'includes_cover', o.includes_cover,
    'selected_cover_url', o.selected_cover_url,
    'tracks', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', t.id, 'track_name', t.track_name, 'storage_path', t.storage_path))
                       FROM public.music_preview_tracks t WHERE t.id = ANY(o.selected_track_ids)), '[]'::jsonb)
  ) INTO v FROM public.music_preview_orders o WHERE o.id = p_order_id;
  RETURN v;
END; $$;

GRANT EXECUTE ON FUNCTION public.get_music_preview_order(uuid) TO anon, authenticated;
