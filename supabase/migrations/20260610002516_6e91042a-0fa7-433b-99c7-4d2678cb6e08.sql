
CREATE SEQUENCE IF NOT EXISTS public.music_previews_number_seq START 1;

ALTER TABLE public.music_previews
  ADD COLUMN IF NOT EXISTS preview_number INTEGER;
ALTER TABLE public.music_previews
  ADD COLUMN IF NOT EXISTS slug TEXT;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.music_previews WHERE preview_number IS NULL ORDER BY created_at LOOP
    UPDATE public.music_previews SET preview_number = nextval('public.music_previews_number_seq') WHERE id = r.id;
  END LOOP;
END $$;

UPDATE public.music_previews
  SET slug = 'previa' || lpad(preview_number::text, 4, '0')
  WHERE slug IS NULL AND preview_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.assign_music_preview_slug()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.preview_number IS NULL THEN
    NEW.preview_number := nextval('public.music_previews_number_seq');
  END IF;
  IF NEW.slug IS NULL THEN
    NEW.slug := 'previa' || lpad(NEW.preview_number::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_assign_music_preview_slug ON public.music_previews;
CREATE TRIGGER trg_assign_music_preview_slug
  BEFORE INSERT ON public.music_previews
  FOR EACH ROW EXECUTE FUNCTION public.assign_music_preview_slug();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'music_previews_slug_unique'
  ) THEN
    ALTER TABLE public.music_previews ADD CONSTRAINT music_previews_slug_unique UNIQUE (slug);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_music_preview_by_token(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_preview public.music_previews%ROWTYPE;
  v_tracks JSONB;
BEGIN
  SELECT * INTO v_preview FROM public.music_previews
    WHERE share_token = p_token OR slug = p_token LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id, 'track_name', t.track_name, 'storage_path', t.storage_path,
    'preview_seconds', t.preview_seconds, 'position', t.position
  ) ORDER BY t.position, t.created_at), '[]'::jsonb)
  INTO v_tracks FROM public.music_preview_tracks t WHERE t.preview_id = v_preview.id;

  RETURN jsonb_build_object(
    'id', v_preview.id, 'client_name', v_preview.client_name,
    'project_title', v_preview.project_title, 'status', v_preview.status,
    'client_comment', v_preview.client_comment, 'reviewed_at', v_preview.reviewed_at,
    'created_at', v_preview.created_at, 'tracks', v_tracks
  );
END; $function$;

DROP FUNCTION IF EXISTS public.submit_music_preview_review(text, text, text);
CREATE FUNCTION public.submit_music_preview_review(p_token text, p_status text, p_comment text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid;
BEGIN
  IF p_status NOT IN ('approved','rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status');
  END IF;
  UPDATE public.music_previews
    SET status = p_status,
        client_comment = NULLIF(trim(p_comment), ''),
        reviewed_at = now(),
        updated_at = now()
    WHERE share_token = p_token OR slug = p_token
    RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;
  RETURN jsonb_build_object('success', true, 'id', v_id);
END; $$;
