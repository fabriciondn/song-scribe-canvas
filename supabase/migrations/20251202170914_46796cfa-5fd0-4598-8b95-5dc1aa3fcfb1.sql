-- Adicionar a função Pendrive ao menu
INSERT INTO public.menu_functions (function_key, name, description, icon, route, status) 
VALUES ('pendrive', 'Pendrive', 'Acesse todas as suas músicas registradas', 'Usb', '/pendrive', 'available')
ON CONFLICT (function_key) DO NOTHING;