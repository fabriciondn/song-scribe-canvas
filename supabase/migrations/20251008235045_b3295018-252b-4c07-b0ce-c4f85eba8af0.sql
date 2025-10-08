-- Remover constraint antiga e adicionar nova com valores corretos
ALTER TABLE public.menu_functions 
DROP CONSTRAINT IF EXISTS menu_functions_status_check;

-- Adicionar nova constraint com todos os valores válidos
ALTER TABLE public.menu_functions 
ADD CONSTRAINT menu_functions_status_check 
CHECK (status IN ('available', 'maintenance', 'disabled', 'coming_soon', 'beta'));