-- Adicionar função de Afiliados ao menu_functions
INSERT INTO public.menu_functions (function_key, name, description, icon, route, status) 
VALUES (
  'affiliate',
  'Afiliados',
  'Programa de afiliados e comissões',
  'TrendingUp',
  '/affiliate',
  'available'
)
ON CONFLICT (function_key) DO NOTHING;