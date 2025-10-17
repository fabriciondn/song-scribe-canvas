-- Atualizar trigger para capturar nome do Google OAuth
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  -- Inserir perfil com nome e email
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, user_name, user_email)
  ON CONFLICT (id) DO UPDATE
  SET 
    name = COALESCE(EXCLUDED.name, profiles.name),
    email = COALESCE(EXCLUDED.email, profiles.email);
    
  RETURN NEW;
END;
$$;