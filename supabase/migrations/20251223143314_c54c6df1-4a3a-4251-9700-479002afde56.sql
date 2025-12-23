
-- Corrigir a função get_drafts para filtrar rascunhos excluídos (soft delete)
CREATE OR REPLACE FUNCTION public.get_drafts()
RETURNS SETOF drafts
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT *
  FROM public.drafts
  WHERE user_id = auth.uid()
    AND deleted_at IS NULL
  ORDER BY created_at DESC;
$$;
