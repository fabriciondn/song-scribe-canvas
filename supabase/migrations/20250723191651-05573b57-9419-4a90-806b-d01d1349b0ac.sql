-- Atualizar créditos do usuário para 50 (supondo que seja para todos os usuários existentes)
UPDATE public.profiles 
SET credits = 50 
WHERE credits = 0 OR credits IS NULL;