-- Adicionar felipetima88@gmail.com como moderador
INSERT INTO public.admin_users (user_id, role, permissions)
VALUES (
  'd32771fd-8797-40e8-88cc-c99475537550',
  'moderator',
  '["manage_user_credits", "create_users"]'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'moderator',
  permissions = '["manage_user_credits", "create_users"]'::jsonb,
  updated_at = NOW();