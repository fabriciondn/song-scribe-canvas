
-- 1. Switch slug format from "previa0001" to "P0001"
CREATE OR REPLACE FUNCTION public.assign_music_preview_slug()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.preview_number IS NULL THEN
    NEW.preview_number := nextval('public.music_previews_number_seq');
  END IF;
  IF NEW.slug IS NULL THEN
    NEW.slug := 'P' || lpad(NEW.preview_number::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;

-- backfill existing slugs to the new short format
UPDATE public.music_previews
SET slug = 'P' || lpad(preview_number::text, 4, '0')
WHERE preview_number IS NOT NULL;

-- 2. Listens tracking
CREATE TABLE IF NOT EXISTS public.music_preview_listens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preview_id uuid NOT NULL REFERENCES public.music_previews(id) ON DELETE CASCADE,
  track_id uuid REFERENCES public.music_preview_tracks(id) ON DELETE CASCADE,
  ip_address text,
  city text,
  region text,
  country text,
  listened_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.music_preview_listens TO anon, authenticated;
GRANT ALL ON public.music_preview_listens TO service_role;
ALTER TABLE public.music_preview_listens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert listen" ON public.music_preview_listens FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read listens" ON public.music_preview_listens FOR SELECT TO authenticated
  USING (public.is_user_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_listens_preview ON public.music_preview_listens(preview_id, created_at DESC);

-- 3. Orders (PIX purchase to unlock downloads of chosen tracks)
CREATE TABLE IF NOT EXISTS public.music_preview_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preview_id uuid NOT NULL REFERENCES public.music_previews(id) ON DELETE CASCADE,
  selected_track_ids uuid[] NOT NULL DEFAULT '{}',
  amount numeric(10,2) NOT NULL DEFAULT 49.99,
  status text NOT NULL DEFAULT 'pending',
  payment_id text,
  pix_qr_code text,
  pix_br_code text,
  payment_url text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.music_preview_orders TO anon, authenticated;
GRANT ALL ON public.music_preview_orders TO service_role;
ALTER TABLE public.music_preview_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage orders" ON public.music_preview_orders FOR ALL TO authenticated
  USING (public.is_user_admin(auth.uid())) WITH CHECK (public.is_user_admin(auth.uid()));
CREATE TRIGGER trg_preview_orders_updated_at BEFORE UPDATE ON public.music_preview_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RPC: log listen (public)
CREATE OR REPLACE FUNCTION public.log_music_preview_listen(
  p_token text, p_track_id uuid, p_seconds integer,
  p_ip text DEFAULT NULL, p_city text DEFAULT NULL, p_region text DEFAULT NULL, p_country text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_preview_id uuid;
BEGIN
  SELECT id INTO v_preview_id FROM public.music_previews WHERE share_token = p_token OR slug = p_token;
  IF v_preview_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.music_preview_listens (preview_id, track_id, ip_address, city, region, country, listened_seconds)
  VALUES (v_preview_id, p_track_id, p_ip, p_city, p_region, p_country, GREATEST(COALESCE(p_seconds,0),0));
END; $$;
GRANT EXECUTE ON FUNCTION public.log_music_preview_listen(text,uuid,integer,text,text,text,text) TO anon, authenticated;

-- 5. RPC: create order (public) — called after approval
CREATE OR REPLACE FUNCTION public.create_music_preview_order(
  p_token text, p_track_ids uuid[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_preview_id uuid; v_order_id uuid;
BEGIN
  SELECT id INTO v_preview_id FROM public.music_previews WHERE share_token = p_token OR slug = p_token;
  IF v_preview_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;
  IF p_track_ids IS NULL OR array_length(p_track_ids,1) IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_tracks');
  END IF;
  INSERT INTO public.music_preview_orders (preview_id, selected_track_ids, amount, status)
  VALUES (v_preview_id, p_track_ids, 49.99, 'pending')
  RETURNING id INTO v_order_id;
  RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'amount', 49.99);
END; $$;
GRANT EXECUTE ON FUNCTION public.create_music_preview_order(text, uuid[]) TO anon, authenticated;

-- 6. RPC: get order (public, for polling)
CREATE OR REPLACE FUNCTION public.get_music_preview_order(p_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', o.id, 'status', o.status, 'amount', o.amount, 'paid_at', o.paid_at,
    'pix_qr_code', o.pix_qr_code, 'pix_br_code', o.pix_br_code, 'payment_url', o.payment_url,
    'selected_track_ids', o.selected_track_ids,
    'tracks', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', t.id, 'track_name', t.track_name, 'storage_path', t.storage_path))
                       FROM public.music_preview_tracks t WHERE t.id = ANY(o.selected_track_ids)), '[]'::jsonb)
  ) INTO v FROM public.music_preview_orders o WHERE o.id = p_order_id;
  RETURN v;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_music_preview_order(uuid) TO anon, authenticated;
