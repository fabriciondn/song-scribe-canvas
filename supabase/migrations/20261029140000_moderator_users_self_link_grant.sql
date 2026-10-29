-- Reforça o acesso de leitura do próprio vínculo para clientes autenticados.
ALTER TABLE public.moderator_users ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.moderator_users TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'moderator_users'
      AND policyname = 'Users can view their own moderator link'
  ) THEN
    CREATE POLICY "Users can view their own moderator link"
      ON public.moderator_users FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;
