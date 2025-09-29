-- Adicionar função de ranking no menu
INSERT INTO public.menu_functions (function_key, name, description, icon, route, status)
VALUES ('ranking', 'Ranking', 'Ranking de compositores por obras registradas', 'Trophy', '/dashboard/ranking', 'available')
ON CONFLICT (function_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  route = EXCLUDED.route,
  status = EXCLUDED.status;