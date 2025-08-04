-- Adicionar role de moderador aos admin_users
INSERT INTO admin_users (user_id, role, permissions) 
SELECT id, 'moderator', '["manage_user_credits", "create_users"]'::jsonb 
FROM profiles 
WHERE FALSE; -- Esta linha não fará nada, é só para mostrar a estrutura

-- Criar tabela para rastrear quais usuários foram criados por moderadores
CREATE TABLE public.moderator_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id) -- Um usuário só pode ser criado por um moderador
);

-- Enable RLS
ALTER TABLE public.moderator_users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para moderator_users
CREATE POLICY "Moderators can view their created users" 
ON public.moderator_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'moderator'
  ) 
  AND moderator_id = auth.uid()
);

CREATE POLICY "Moderators can insert their created users" 
ON public.moderator_users 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'moderator'
  ) 
  AND moderator_id = auth.uid()
);

CREATE POLICY "Admins can view all moderator users" 
ON public.moderator_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Função para verificar se usuário é moderador
CREATE OR REPLACE FUNCTION public.is_user_moderator(check_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = check_user_id 
    AND role = 'moderator'
  );
$function$

-- Função para moderador atualizar créditos de usuários que ele criou
CREATE OR REPLACE FUNCTION public.moderator_update_user_credits(target_user_id uuid, new_credits integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  old_credits_value integer;
  moderator_credits integer;
  credit_difference integer;
BEGIN
  -- Verificar se o usuário atual é moderador
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'moderator'
  ) THEN
    RAISE EXCEPTION 'Access denied. Moderator privileges required.';
  END IF;

  -- Verificar se o usuário foi criado por este moderador
  IF NOT EXISTS (
    SELECT 1 FROM public.moderator_users 
    WHERE user_id = target_user_id 
    AND moderator_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You can only manage credits for users you have created.';
  END IF;

  -- Buscar créditos atuais do usuário alvo
  SELECT credits INTO old_credits_value 
  FROM public.profiles 
  WHERE id = target_user_id;

  -- Calcular diferença de créditos
  credit_difference := new_credits - old_credits_value;

  -- Se está aumentando créditos, verificar se moderador tem créditos suficientes
  IF credit_difference > 0 THEN
    SELECT credits INTO moderator_credits 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    IF moderator_credits < credit_difference THEN
      RAISE EXCEPTION 'Insufficient credits. You have % credits but need % more.', moderator_credits, credit_difference;
    END IF;
    
    -- Debitar créditos do moderador
    UPDATE public.profiles 
    SET credits = credits - credit_difference
    WHERE id = auth.uid();
  ELSE
    -- Se está diminuindo créditos, creditar de volta ao moderador
    UPDATE public.profiles 
    SET credits = credits + ABS(credit_difference)
    WHERE id = auth.uid();
  END IF;

  -- Atualizar os créditos do usuário alvo
  UPDATE public.profiles 
  SET credits = new_credits
  WHERE id = target_user_id;

  -- Log da atividade
  INSERT INTO public.user_activity_logs (user_id, action, metadata)
  VALUES (
    target_user_id, 
    'credits_updated_by_moderator', 
    jsonb_build_object(
      'moderator_user_id', auth.uid(),
      'old_credits', old_credits_value,
      'new_credits', new_credits,
      'credit_difference', credit_difference
    )
  );
END;
$function$

-- Função para buscar estatísticas do dashboard do moderador
CREATE OR REPLACE FUNCTION public.get_moderator_dashboard_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
$function$

-- Trigger para atualizar updated_at na tabela moderator_users
CREATE TRIGGER update_moderator_users_updated_at
  BEFORE UPDATE ON public.moderator_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();