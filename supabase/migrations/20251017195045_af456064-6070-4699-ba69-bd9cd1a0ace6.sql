-- Garantir que o trigger está ativo e funcionando corretamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_profile_for_user();

-- Atualizar a função para ter SET search_path
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- Extrair nome dos metadados (funciona para email e Google)
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  user_email := NEW.email;
  
  -- Log para debug
  RAISE NOTICE 'Creating profile for user: %, email: %, name: %', NEW.id, user_email, user_name;
  
  -- Inserir perfil com nome e email
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, user_name, user_email)
  ON CONFLICT (id) DO UPDATE
  SET 
    name = COALESCE(EXCLUDED.name, profiles.name),
    email = COALESCE(EXCLUDED.email, profiles.email);
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não bloqueia o signup
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;