-- Inserir a função "plans" na tabela menu_functions com is_hidden = true
INSERT INTO public.menu_functions (function_key, name, description, status, is_hidden, route, icon)
VALUES (
  'plans',
  'Planos',
  'Página de planos e preços da plataforma',
  'available',
  true,
  '/plans',
  'Crown'
)
ON CONFLICT (function_key) DO UPDATE SET
  is_hidden = true,
  updated_at = NOW();