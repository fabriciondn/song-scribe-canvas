-- Função para verificar se usuário é moderador
CREATE OR REPLACE FUNCTION public.is_user_moderator(check_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = check_user_id 
    AND role = 'moderator'
  );
$function$;