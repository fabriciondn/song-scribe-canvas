-- Permite que cada usuário autenticado consulte somente seu próprio vínculo com moderador.
ALTER TABLE public.moderator_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'moderator_users'
      AND policyname = 'Users can view their own moderator assignment'
  ) THEN
    CREATE POLICY "Users can view their own moderator assignment"
    ON public.moderator_users
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END
$$;
