-- Tighten admin/user visibility and storage policies for sensitive data

-- 1. admin_users: only let a signed-in user read their own admin row for role checks
DROP POLICY IF EXISTS "Authenticated users can view admin status for role checking" ON public.admin_users;
CREATE POLICY "Users can view their own admin status"
ON public.admin_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. affiliates: remove the overly broad update policy exposed to every caller
DROP POLICY IF EXISTS "Service role can update affiliates" ON public.affiliates;

-- 3. collaborative sessions: limit visibility to hosts and invited participants
DROP POLICY IF EXISTS "sessions_select" ON public.collaborative_sessions;
CREATE POLICY "Hosts and participants can view collaborative sessions"
ON public.collaborative_sessions
FOR SELECT
TO authenticated
USING (
  auth.uid() = host_user_id
  OR EXISTS (
    SELECT 1
    FROM public.collaborative_participants cp
    WHERE cp.session_id = collaborative_sessions.id
      AND cp.user_id = auth.uid()
  )
);

-- 4. collaborative participants: limit visibility to the host or participants of the same session
DROP POLICY IF EXISTS "participants_select" ON public.collaborative_participants;
CREATE POLICY "Hosts and participants can view session participants"
ON public.collaborative_participants
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.collaborative_sessions cs
    WHERE cs.id = collaborative_participants.session_id
      AND cs.host_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.collaborative_participants cp_self
    WHERE cp_self.session_id = collaborative_participants.session_id
      AND cp_self.user_id = auth.uid()
  )
);

-- 5. moderator payment settings: add explicit self-read protection for moderators
CREATE POLICY "Moderators can view their own payment settings"
ON public.moderator_payment_settings
FOR SELECT
TO authenticated
USING (moderator_id = auth.uid());

-- 6. author-registrations bucket: keep public uploads for onboarding, but stop public listing/reads
DROP POLICY IF EXISTS "Allow public select from author-registrations" ON storage.objects;

-- 7. temp-pdfs bucket: remove broad public/authenticated writes and deletes, keep service-role only
DROP POLICY IF EXISTS "Authenticated users can upload temp PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de PDFs pela função" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de PDFs pela função" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de PDFs pela função" ON storage.objects;
DROP POLICY IF EXISTS "Public can view temp PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura pública de PDFs temporários" ON storage.objects;

-- 8. Realtime exposure: sensitive tables do not need direct publication because the app already reloads data after writes
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.author_registrations;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.affiliate_commissions;
