-- Criar política para permitir que colaboradores vejam a base musical usada em sessões colaborativas ativas
CREATE POLICY "Collaborators can view shared music bases"
ON public.music_bases
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.collaborative_sessions cs
    JOIN public.collaborative_participants cp ON cs.id = cp.session_id
    JOIN public.drafts d ON cs.draft_id = d.id
    WHERE d.selected_base_id = music_bases.id
      AND cs.is_active = true
      AND cs.expires_at > now()
      AND cp.user_id = auth.uid()
  )
);

-- Remover a política antiga de visualização
DROP POLICY IF EXISTS "Users can view their own music bases" ON public.music_bases;