-- 1) Tighten subscription_credits_bonus: drop ALL policy that allowed self-grant
DROP POLICY IF EXISTS "System can manage bonus credits" ON public.subscription_credits_bonus;

-- Keep only SELECT for users (already exists). Add explicit service_role write policy.
CREATE POLICY "Service role manages bonus credits"
  ON public.subscription_credits_bonus
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2) Remove permissive music-previews SELECT policy on storage.objects
DROP POLICY IF EXISTS "Anon read music previews via signed url" ON storage.objects;