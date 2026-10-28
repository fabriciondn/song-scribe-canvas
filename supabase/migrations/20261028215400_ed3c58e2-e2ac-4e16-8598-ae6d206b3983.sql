CREATE FUNCTION public.protect_pending_legacy_launch() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF OLD.status='pending' AND NEW.status='paid' AND EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=NEW.user_id AND status='pending') THEN RAISE EXCEPTION 'Previous subscription payment is pending; reconciliation required'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_pending_legacy_launch() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER launch_pending_legacy_guard BEFORE UPDATE ON public.subscription_launch_orders FOR EACH ROW EXECUTE FUNCTION public.protect_pending_legacy_launch();