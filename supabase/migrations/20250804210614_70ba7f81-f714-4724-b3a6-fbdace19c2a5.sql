-- Corrigir funções com SET search_path para atender aos warnings de segurança

-- Corrigir função get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role TEXT := 'user';
BEGIN
  -- Verificar se é admin ou super_admin
  SELECT role INTO user_role
  FROM admin_users
  WHERE admin_users.user_id = get_user_role.user_id
  AND role IN ('admin', 'super_admin', 'moderator')
  LIMIT 1;
  
  -- Se não encontrou, retornar 'user'
  IF user_role IS NULL THEN
    user_role := 'user';
  END IF;
  
  RETURN user_role;
END;
$$;

-- Corrigir função update_user_credits
CREATE OR REPLACE FUNCTION public.update_user_credits(
  target_user_id UUID,
  credit_amount INTEGER,
  transaction_description TEXT DEFAULT 'Créditos adicionados pelo moderador'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_moderator_id UUID;
  moderator_role TEXT;
BEGIN
  -- Obter ID do usuário autenticado
  current_moderator_id := auth.uid();
  
  IF current_moderator_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se o usuário atual é moderador ou admin
  SELECT role INTO moderator_role
  FROM admin_users
  WHERE user_id = current_moderator_id
  AND role IN ('moderator', 'admin', 'super_admin');
  
  IF moderator_role IS NULL THEN
    RAISE EXCEPTION 'Apenas moderadores podem atualizar créditos';
  END IF;
  
  -- Atualizar créditos do usuário
  UPDATE profiles
  SET credits = COALESCE(credits, 0) + credit_amount
  WHERE id = target_user_id;
  
  -- Registrar transação
  INSERT INTO moderator_transactions (
    moderator_id,
    user_id,
    amount,
    description
  ) VALUES (
    current_moderator_id,
    target_user_id,
    credit_amount,
    transaction_description
  );
  
  RETURN TRUE;
END;
$$;

-- Corrigir função complete_author_registration_analysis
CREATE OR REPLACE FUNCTION public.complete_author_registration_analysis()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se o status mudou para 'analysis' e ainda não foi analisado
  IF NEW.status = 'analysis' AND OLD.status != 'analysis' THEN
    -- Atualizar timestamps de análise
    NEW.analysis_started_at = NOW();
    NEW.analysis_completed_at = NOW();
    
    -- Gerar hash se não existir
    IF NEW.hash IS NULL THEN
      NEW.hash = encode(digest(concat(NEW.title, NEW.author, NEW.lyrics, NEW.created_at::text), 'sha256'), 'hex');
    END IF;
    
    -- Mudar status para completed
    NEW.status = 'completed';
  END IF;
  
  RETURN NEW;
END;
$$;