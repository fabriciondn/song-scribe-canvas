CREATE OR REPLACE FUNCTION public.get_landing_composer_avatars(limit_count int DEFAULT 30)
RETURNS TABLE(name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(NULLIF(split_part(COALESCE(artistic_name, name, ''), ' ', 1), ''), 'Compositor') AS name,
    avatar_url
  FROM public.profiles
  WHERE avatar_url IS NOT NULL
    AND avatar_url LIKE 'http%'
  ORDER BY random()
  LIMIT GREATEST(1, LEAST(limit_count, 60));
$$;

GRANT EXECUTE ON FUNCTION public.get_landing_composer_avatars(int) TO anon, authenticated;