
CREATE OR REPLACE FUNCTION public.prevent_subscription_self_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin boolean := false;
  current_role_name text := current_setting('role', true);
BEGIN
  IF current_role_name = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'super_admin'::app_role)
      INTO is_admin;
  END IF;

  IF is_admin THEN
    RETURN NEW;
  END IF;

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
  IF NEW.payment_provider_subscription_id IS DISTINCT FROM OLD.payment_provider_subscription_id THEN
    RAISE EXCEPTION 'Not allowed to change payment_provider_subscription_id';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'expired' THEN
    RAISE EXCEPTION 'Not allowed to change subscription status';
  END IF;

  RETURN NEW;
END;
$function$;

UPDATE public.subscriptions
SET status = 'expired', updated_at = now()
WHERE status = 'active' AND expires_at < now();
