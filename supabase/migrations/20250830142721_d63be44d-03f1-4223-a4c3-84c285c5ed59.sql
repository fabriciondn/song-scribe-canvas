
-- Inserir a nova função "Minhas Compras" na tabela menu_functions
INSERT INTO public.menu_functions (function_key, name, description, icon, route, status, is_hidden) 
VALUES (
  'my-purchases', 
  'Minhas Compras', 
  'Histórico de compras e transações de créditos', 
  'CreditCard', 
  '/dashboard/my-purchases', 
  'available', 
  false
) 
ON CONFLICT (function_key) DO NOTHING;
