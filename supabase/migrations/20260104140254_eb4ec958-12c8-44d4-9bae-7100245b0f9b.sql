-- Atualizar função get_draft_by_id para permitir participantes colaborativos
CREATE OR REPLACE FUNCTION public.get_draft_by_id(draft_id uuid)
RETURNS drafts
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT *
  FROM public.drafts d
  WHERE d.id = $1
    AND d.deleted_at IS NULL
    AND (
      d.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.collaborative_sessions cs
        JOIN public.collaborative_participants cp ON cs.id = cp.session_id
        WHERE cs.draft_id = d.id
          AND cs.is_active = true
          AND cs.expires_at > now()
          AND cp.user_id = auth.uid()
      )
    );
$$;