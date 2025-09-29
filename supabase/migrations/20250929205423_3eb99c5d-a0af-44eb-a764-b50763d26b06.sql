-- Criar função para buscar ranking dos compositores
CREATE OR REPLACE FUNCTION public.get_composers_ranking()
 RETURNS TABLE(
   id uuid,
   name text,
   artistic_name text,
   avatar_url text,
   email text,
   total_works bigint,
   created_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.artistic_name,
    p.avatar_url,
    p.email,
    COUNT(ar.id) as total_works,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.author_registrations ar ON p.id = ar.user_id
  WHERE ar.status = 'registered' OR ar.status = 'completed'
  GROUP BY p.id, p.name, p.artistic_name, p.avatar_url, p.email, p.created_at
  HAVING COUNT(ar.id) > 0
  ORDER BY COUNT(ar.id) DESC, p.created_at ASC
  LIMIT 50;
END;
$function$;