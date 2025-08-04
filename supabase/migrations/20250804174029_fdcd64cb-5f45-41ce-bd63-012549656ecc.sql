-- Função para buscar estatísticas do dashboard do moderador
CREATE OR REPLACE FUNCTION public.get_moderator_dashboard_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  result JSONB;
  total_managed_users INTEGER;
  total_managed_songs INTEGER;
  total_managed_drafts INTEGER;
  total_managed_registered_works INTEGER;
  total_credits_distributed INTEGER;
BEGIN
  -- Verificar se usuário é moderador
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'moderator'
  ) THEN
    RAISE EXCEPTION 'Access denied. Moderator privileges required.';
  END IF;

  -- Get total de usuários gerenciados
  SELECT COUNT(*) INTO total_managed_users 
  FROM public.moderator_users 
  WHERE moderator_id = auth.uid();
  
  -- Get total de músicas dos usuários gerenciados
  SELECT COUNT(*) INTO total_managed_songs 
  FROM public.songs s
  JOIN public.moderator_users mu ON s.user_id = mu.user_id
  WHERE mu.moderator_id = auth.uid() 
  AND s.deleted_at IS NULL;
  
  -- Get total de drafts dos usuários gerenciados
  SELECT COUNT(*) INTO total_managed_drafts 
  FROM public.drafts d
  JOIN public.moderator_users mu ON d.user_id = mu.user_id
  WHERE mu.moderator_id = auth.uid() 
  AND d.deleted_at IS NULL;
  
  -- Get total de obras registradas dos usuários gerenciados
  SELECT COUNT(*) INTO total_managed_registered_works 
  FROM public.author_registrations ar
  JOIN public.moderator_users mu ON ar.user_id = mu.user_id
  WHERE mu.moderator_id = auth.uid();
  
  -- Get total de créditos distribuídos (soma dos créditos atuais dos usuários gerenciados)
  SELECT COALESCE(SUM(p.credits), 0) INTO total_credits_distributed
  FROM public.profiles p
  JOIN public.moderator_users mu ON p.id = mu.user_id
  WHERE mu.moderator_id = auth.uid();

  result := jsonb_build_object(
    'total_managed_users', total_managed_users,
    'total_managed_songs', total_managed_songs,
    'total_managed_drafts', total_managed_drafts,
    'total_managed_registered_works', total_managed_registered_works,
    'total_credits_distributed', total_credits_distributed
  );

  RETURN result;
END;
$function$;