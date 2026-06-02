
-- Helper: convert text into slug
CREATE OR REPLACE FUNCTION public.composer_slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(
    regexp_replace(
      regexp_replace(
        translate(
          coalesce(input, ''),
          'ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
          'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
        ),
        '[^a-zA-Z0-9]+', '-', 'g'
      ),
      '(^-+|-+$)', '', 'g'
    )
  )
$$;

-- Public RPC: returns composer public profile + registered works by slug
CREATE OR REPLACE FUNCTION public.get_public_composer_profile(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last4 text;
  v_name_slug text;
  v_profile RECORD;
  v_works jsonb;
BEGIN
  IF p_slug IS NULL OR p_slug !~ '^[a-z0-9-]+-[0-9]{4}$' THEN
    RETURN NULL;
  END IF;

  v_last4 := right(p_slug, 4);
  v_name_slug := left(p_slug, length(p_slug) - 5); -- remove '-XXXX'

  SELECT p.id, p.name, p.artistic_name, p.avatar_url
    INTO v_profile
  FROM public.profiles p
  WHERE p.cpf IS NOT NULL
    AND right(regexp_replace(p.cpf, '[^0-9]', '', 'g'), 4) = v_last4
    AND public.composer_slugify(split_part(coalesce(p.name, ''), ' ', 1)) = v_name_slug
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ar.id,
    'title', ar.title,
    'author', ar.author,
    'other_authors', ar.other_authors,
    'genre', ar.genre,
    'rhythm', ar.rhythm,
    'song_version', ar.song_version,
    'lyrics', ar.lyrics,
    'hash', ar.hash,
    'created_at', ar.created_at,
    'status', ar.status
  ) ORDER BY ar.created_at DESC), '[]'::jsonb)
    INTO v_works
  FROM public.author_registrations ar
  WHERE ar.user_id = v_profile.id
    AND ar.status IN ('registered', 'completed');

  RETURN jsonb_build_object(
    'profile', jsonb_build_object(
      'name', v_profile.name,
      'artistic_name', v_profile.artistic_name,
      'avatar_url', v_profile.avatar_url
    ),
    'works', v_works
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_composer_profile(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.composer_slugify(text) TO anon, authenticated;
