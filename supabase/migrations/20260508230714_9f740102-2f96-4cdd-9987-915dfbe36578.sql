
DROP VIEW IF EXISTS public.public_composers;

CREATE OR REPLACE FUNCTION public.get_public_composers(p_limit int DEFAULT 50)
RETURNS TABLE(id uuid, name text, artistic_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.artistic_name, p.avatar_url
  FROM public.profiles p
  WHERE p.name IS NOT NULL
  ORDER BY p.created_at DESC
  LIMIT GREATEST(LEAST(p_limit, 200), 1);
$$;

REVOKE ALL ON FUNCTION public.get_public_composers(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_composers(int) TO anon, authenticated;
