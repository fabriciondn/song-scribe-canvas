
-- 1. Add customization fields to music_previews
ALTER TABLE public.music_previews
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS checkout_config JSONB;

-- 2. Global template table (singleton per scope)
CREATE TABLE IF NOT EXISTS public.preview_checkout_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL UNIQUE DEFAULT 'global',
  banner_url TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.preview_checkout_template TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.preview_checkout_template TO authenticated;
GRANT ALL ON public.preview_checkout_template TO service_role;

ALTER TABLE public.preview_checkout_template ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read template" ON public.preview_checkout_template;
CREATE POLICY "public read template" ON public.preview_checkout_template FOR SELECT USING (true);

DROP POLICY IF EXISTS "admins manage template" ON public.preview_checkout_template;
CREATE POLICY "admins manage template" ON public.preview_checkout_template
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid())
  );

CREATE TRIGGER trg_preview_checkout_template_updated
BEFORE UPDATE ON public.preview_checkout_template
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Storage policies for preview-banners (public read, admin write)
DROP POLICY IF EXISTS "preview banners public read" ON storage.objects;
CREATE POLICY "preview banners public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'preview-banners');

DROP POLICY IF EXISTS "preview banners admin write" ON storage.objects;
CREATE POLICY "preview banners admin write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'preview-banners'
    AND EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "preview banners admin update" ON storage.objects;
CREATE POLICY "preview banners admin update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'preview-banners'
    AND EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "preview banners admin delete" ON storage.objects;
CREATE POLICY "preview banners admin delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'preview-banners'
    AND EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid())
  );

-- 4. RPC to get global template (public)
CREATE OR REPLACE FUNCTION public.get_preview_checkout_template()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_row public.preview_checkout_template%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.preview_checkout_template WHERE scope = 'global' LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('banner_url', NULL, 'config', '{}'::jsonb); END IF;
  RETURN jsonb_build_object('banner_url', v_row.banner_url, 'config', v_row.config);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_preview_checkout_template() TO anon, authenticated;

-- 5. Update get_music_preview_by_token to include banner + config + template
CREATE OR REPLACE FUNCTION public.get_music_preview_by_token(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_preview public.music_previews%ROWTYPE;
  v_tracks JSONB;
  v_template public.preview_checkout_template%ROWTYPE;
BEGIN
  SELECT * INTO v_preview FROM public.music_previews
    WHERE share_token = p_token OR slug = p_token LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id, 'track_name', t.track_name, 'storage_path', t.storage_path,
    'preview_seconds', t.preview_seconds, 'position', t.position
  ) ORDER BY t.position, t.created_at), '[]'::jsonb)
  INTO v_tracks FROM public.music_preview_tracks t WHERE t.preview_id = v_preview.id;

  SELECT * INTO v_template FROM public.preview_checkout_template WHERE scope='global' LIMIT 1;

  RETURN jsonb_build_object(
    'id', v_preview.id, 'client_name', v_preview.client_name,
    'project_title', v_preview.project_title, 'status', v_preview.status,
    'client_comment', v_preview.client_comment, 'reviewed_at', v_preview.reviewed_at,
    'created_at', v_preview.created_at, 'tracks', v_tracks,
    'banner_url', v_preview.banner_url,
    'checkout_config', COALESCE(v_preview.checkout_config, '{}'::jsonb),
    'template_banner_url', v_template.banner_url,
    'template_config', COALESCE(v_template.config, '{}'::jsonb)
  );
END; $function$;
