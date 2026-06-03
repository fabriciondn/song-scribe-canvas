
-- Block privilege escalation on subscriptions:
-- Non-admin, non-service_role users may only set status to 'expired'.
-- They cannot change plan_type, expires_at, started_at, user_id, payment_id, etc.
CREATE OR REPLACE FUNCTION public.prevent_subscription_self_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
  current_role_name text := current_setting('role', true);
BEGIN
  -- service_role bypass (edge functions / webhooks)
  IF current_role_name = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Admin / super_admin bypass
  IF auth.uid() IS NOT NULL THEN
    SELECT public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'super_admin'::app_role)
      INTO is_admin;
  END IF;

  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Regular user: forbid changes to sensitive columns.
  IF NEW.plan_type IS DISTINCT FROM OLD.plan_type THEN
    RAISE EXCEPTION 'Not allowed to change plan_type';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to change user_id';
  END IF;
  IF NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    RAISE EXCEPTION 'Not allowed to change expires_at';
  END IF;
  IF NEW.started_at IS DISTINCT FROM OLD.started_at THEN
    RAISE EXCEPTION 'Not allowed to change started_at';
  END IF;
  IF NEW.payment_id IS DISTINCT FROM OLD.payment_id THEN
    RAISE EXCEPTION 'Not allowed to change payment_id';
  END IF;

  -- Status can only move to 'expired' (self-cleanup) or stay equal.
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'expired' THEN
    RAISE EXCEPTION 'Not allowed to change subscription status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_subscription_self_upgrade ON public.subscriptions;
CREATE TRIGGER trg_prevent_subscription_self_upgrade
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_subscription_self_upgrade();
