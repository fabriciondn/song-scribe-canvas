-- Inserir perfil para felipetima88@gmail.com
INSERT INTO public.profiles (id, email, name, credits)
VALUES (
  gen_random_uuid(),
  'felipetima88@gmail.com',
  'Felipe Tima',
  100
) ON CONFLICT (email) DO NOTHING;

-- Inserir como moderador na tabela admin_users
INSERT INTO public.admin_users (user_id, role, permissions)
SELECT 
  p.id,
  'moderator',
  '["manage_user_credits", "create_users"]'::jsonb
FROM public.profiles p 
WHERE p.email = 'felipetima88@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET 
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();