-- Inserir perfil para felipetima88@gmail.com usando o ID existente na auth.users
INSERT INTO public.profiles (id, email, name, credits)
VALUES (
  'd32771fd-8797-40e8-88cc-c99475537550',
  'felipetima88@gmail.com',
  'Felipe Tima',
  100
) ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name;

-- Inserir como moderador na tabela admin_users
INSERT INTO public.admin_users (user_id, role, permissions)
VALUES (
  'd32771fd-8797-40e8-88cc-c99475537550',
  'moderator',
  '["manage_user_credits", "create_users"]'::jsonb
) ON CONFLICT (user_id) DO UPDATE SET 
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();