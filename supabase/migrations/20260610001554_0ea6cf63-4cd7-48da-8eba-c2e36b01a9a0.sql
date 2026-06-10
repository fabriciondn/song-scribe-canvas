
-- Tabela de prévias musicais (uma por link)
CREATE TABLE public.music_previews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  project_title TEXT,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  client_comment TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX music_previews_admin_idx ON public.music_previews(admin_user_id);
CREATE INDEX music_previews_token_idx ON public.music_previews(share_token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.music_previews TO authenticated;
GRANT ALL ON public.music_previews TO service_role;

ALTER TABLE public.music_previews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam prévias"
  ON public.music_previews FOR ALL
  TO authenticated
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

-- Faixas da prévia
CREATE TABLE public.music_preview_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preview_id UUID NOT NULL REFERENCES public.music_previews(id) ON DELETE CASCADE,
  track_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  preview_seconds INTEGER NOT NULL DEFAULT 30 CHECK (preview_seconds > 0 AND preview_seconds <= 600),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX music_preview_tracks_preview_idx ON public.music_preview_tracks(preview_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.music_preview_tracks TO authenticated;
GRANT ALL ON public.music_preview_tracks TO service_role;

ALTER TABLE public.music_preview_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam faixas"
  ON public.music_preview_tracks FOR ALL
  TO authenticated
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_music_previews_updated_at
BEFORE UPDATE ON public.music_previews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função pública que retorna a prévia + faixas pelo token (anon-friendly)
CREATE OR REPLACE FUNCTION public.get_music_preview_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preview public.music_previews%ROWTYPE;
  v_tracks JSONB;
BEGIN
  SELECT * INTO v_preview
  FROM public.music_previews
  WHERE share_token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'track_name', t.track_name,
    'storage_path', t.storage_path,
    'preview_seconds', t.preview_seconds,
    'position', t.position
  ) ORDER BY t.position, t.created_at), '[]'::jsonb)
  INTO v_tracks
  FROM public.music_preview_tracks t
  WHERE t.preview_id = v_preview.id;

  RETURN jsonb_build_object(
    'id', v_preview.id,
    'client_name', v_preview.client_name,
    'project_title', v_preview.project_title,
    'status', v_preview.status,
    'client_comment', v_preview.client_comment,
    'reviewed_at', v_preview.reviewed_at,
    'created_at', v_preview.created_at,
    'tracks', v_tracks
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_music_preview_by_token(TEXT) TO anon, authenticated;

-- Função pública para o cliente registrar aprovação/recusa
CREATE OR REPLACE FUNCTION public.submit_music_preview_review(
  p_token TEXT,
  p_status TEXT,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_status NOT IN ('approved', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Status inválido');
  END IF;

  UPDATE public.music_previews
  SET status = p_status,
      client_comment = p_comment,
      reviewed_at = NOW(),
      updated_at = NOW()
  WHERE share_token = p_token
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Prévia não encontrada');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_music_preview_review(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Política de Storage: admins podem fazer upload no bucket music-previews
-- (objetos lidos via signed URL gerada por anon — política de SELECT permite anon)
CREATE POLICY "Admins upload music previews"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'music-previews' AND public.is_user_admin(auth.uid()));

CREATE POLICY "Admins update music previews"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'music-previews' AND public.is_user_admin(auth.uid()));

CREATE POLICY "Admins delete music previews"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'music-previews' AND public.is_user_admin(auth.uid()));

CREATE POLICY "Anon read music previews via signed url"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'music-previews');
