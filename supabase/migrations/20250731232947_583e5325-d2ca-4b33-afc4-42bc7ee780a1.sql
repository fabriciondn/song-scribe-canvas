-- Adicionar o usuário atual como administrador
-- Primeiro, vamos inserir o usuário logado como admin
-- Isso permitirá acesso ao painel administrativo

INSERT INTO public.admin_users (user_id, role, permissions)
SELECT auth.uid(), 'admin', '["full_access", "user_management", "content_management", "analytics"]'::jsonb
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  permissions = '["full_access", "user_management", "content_management", "analytics"]'::jsonb,
  updated_at = now();