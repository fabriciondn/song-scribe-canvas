-- Adicionar campo de notas para usuários gerenciados por moderadores
ALTER TABLE public.profiles 
ADD COLUMN moderator_notes TEXT DEFAULT '';

-- Adicionar índice para melhor performance nas consultas
CREATE INDEX idx_profiles_moderator_notes ON public.profiles (moderator_notes) WHERE moderator_notes IS NOT NULL AND moderator_notes != '';