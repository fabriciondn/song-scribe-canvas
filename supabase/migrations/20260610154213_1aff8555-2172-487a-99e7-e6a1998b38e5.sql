DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.author_registrations;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.affiliate_withdrawal_requests;
  EXCEPTION WHEN undefined_object THEN NULL; END;
END $$;

ALTER TABLE public.public_registration_forms DROP COLUMN IF EXISTS password;