-- Verificar se o usuário já existe e inserir se não existir
DO $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Verificar se o usuário já existe
    SELECT id INTO user_uuid FROM public.profiles WHERE email = 'felipetima88@gmail.com';
    
    -- Se não existe, criar o usuário
    IF user_uuid IS NULL THEN
        user_uuid := gen_random_uuid();
        
        INSERT INTO public.profiles (id, email, name, credits)
        VALUES (user_uuid, 'felipetima88@gmail.com', 'Felipe Tima', 100);
    END IF;
    
    -- Inserir ou atualizar como moderador
    INSERT INTO public.admin_users (user_id, role, permissions)
    VALUES (user_uuid, 'moderator', '["manage_user_credits", "create_users"]'::jsonb)
    ON CONFLICT (user_id) DO UPDATE SET 
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        updated_at = NOW();
        
    RAISE NOTICE 'Usuario Felipe Tima criado/atualizado como moderador com ID: %', user_uuid;
END $$;