-- Fix: remove recursive RLS policies and recreate non-recursive ones

-- Ensure RLS is enabled
ALTER TABLE public.collaborative_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborative_participants ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (some still reference the other table and cause infinite recursion)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'collaborative_sessions'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.collaborative_sessions', r.policyname);
  END LOOP;

  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'collaborative_participants'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.collaborative_participants', r.policyname);
  END LOOP;
END
$$;

-- Recreate SIMPLE, NON-RECURSIVE policies

-- collaborative_sessions
CREATE POLICY "sessions_insert"
ON public.collaborative_sessions
FOR INSERT
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "sessions_select"
ON public.collaborative_sessions
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "sessions_update"
ON public.collaborative_sessions
FOR UPDATE
USING (auth.uid() = host_user_id)
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "sessions_delete"
ON public.collaborative_sessions
FOR DELETE
USING (auth.uid() = host_user_id);

-- collaborative_participants
CREATE POLICY "participants_insert"
ON public.collaborative_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "participants_select"
ON public.collaborative_participants
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "participants_update"
ON public.collaborative_participants
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "participants_delete"
ON public.collaborative_participants
FOR DELETE
USING (auth.uid() = user_id);
