
-- 1. offer_page_settings: restrict public read to non-sensitive keys
DROP POLICY IF EXISTS "Public can read offer page settings" ON public.offer_page_settings;
CREATE POLICY "Public can read non-sensitive offer settings"
ON public.offer_page_settings
FOR SELECT
TO anon, authenticated
USING (setting_key IN ('meta_pixel_code','meta_pixel_id','video_url','progress_bar_height','use_sound_overlay'));

-- 2. user_acordes: remove permissive ALL public policy (service_role bypasses RLS)
DROP POLICY IF EXISTS "Service role can manage all acordes" ON public.user_acordes;

-- 3. credit_transactions: remove permissive insert/update public policies
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Service role can update credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Service role can update transactions" ON public.credit_transactions;

-- 4. acorde_redemptions
DROP POLICY IF EXISTS "Service role can insert redemptions" ON public.acorde_redemptions;

-- 5. acorde_history
DROP POLICY IF EXISTS "Service role can insert history" ON public.acorde_history;

-- 6. affiliate_commissions
DROP POLICY IF EXISTS "Service role can insert commissions" ON public.affiliate_commissions;

-- 7. affiliate_conversions
DROP POLICY IF EXISTS "Service role can insert conversions" ON public.affiliate_conversions;

-- 8. composer_tokens: remove broad authenticated read, create SECURITY DEFINER validator
DROP POLICY IF EXISTS "Authenticated users can validate tokens" ON public.composer_tokens;

CREATE OR REPLACE FUNCTION public.validate_composer_token(p_token text)
RETURNS TABLE(user_id uuid, name text, cpf text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id AS user_id, p.name, p.cpf, p.avatar_url
  FROM public.composer_tokens t
  JOIN public.profiles p ON p.id = t.user_id
  WHERE t.token = p_token
    AND t.is_active = true
    AND t.expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.validate_composer_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_composer_token(text) TO authenticated;

-- 9. profiles: remove anon PII exposure, create safe public view
DROP POLICY IF EXISTS "Public can view basic composer info for landing page" ON public.profiles;

CREATE OR REPLACE VIEW public.public_composers
WITH (security_invoker = true) AS
SELECT id, name, artistic_name, avatar_url, created_at
FROM public.profiles
WHERE name IS NOT NULL;

GRANT SELECT ON public.public_composers TO anon, authenticated;

-- Allow anon/auth to read this view by adding a permissive SELECT policy for the underlying rows ONLY when accessed via the view's security_invoker context — the view will use the caller's RLS, so we need a dedicated minimal policy. Instead, switch to security_definer view:
DROP VIEW IF EXISTS public.public_composers;
CREATE VIEW public.public_composers
WITH (security_invoker = false) AS
SELECT id, name, artistic_name, avatar_url, created_at
FROM public.profiles
WHERE name IS NOT NULL;

GRANT SELECT ON public.public_composers TO anon, authenticated;

-- 10. raffle_reservations: restrict public read to authenticated only
DROP POLICY IF EXISTS "Users can view all reservations" ON public.raffle_reservations;
CREATE POLICY "Authenticated users can view reservations"
ON public.raffle_reservations
FOR SELECT
TO authenticated
USING (true);

-- 11. backups bucket: explicit UPDATE policy scoped to owner folder
CREATE POLICY "Users can update their own backup files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'backups' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'backups' AND (auth.uid())::text = (storage.foldername(name))[1]);
