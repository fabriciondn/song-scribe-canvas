CREATE TABLE public.subscription_launch_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id), provider text NOT NULL, payment_id text NOT NULL, amount numeric NOT NULL DEFAULT 97, status text NOT NULL DEFAULT 'pending', paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider,payment_id)
);
GRANT SELECT ON public.subscription_launch_orders TO authenticated;
GRANT ALL ON public.subscription_launch_orders TO service_role;
ALTER TABLE public.subscription_launch_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY launch_orders_owner_read ON public.subscription_launch_orders FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE TRIGGER launch_orders_updated BEFORE UPDATE ON public.subscription_launch_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE public.subscription_registration_allowances (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id), order_id uuid NOT NULL REFERENCES public.subscription_launch_orders(id), remaining integer NOT NULL DEFAULT 50, cycle_start timestamptz NOT NULL, cycle_end timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_registration_allowances TO authenticated;
GRANT ALL ON public.subscription_registration_allowances TO service_role;
ALTER TABLE public.subscription_registration_allowances ENABLE ROW LEVEL SECURITY;
CREATE POLICY allowance_owner_read ON public.subscription_registration_allowances FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE TRIGGER allowance_updated BEFORE UPDATE ON public.subscription_registration_allowances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE FUNCTION public.validate_launch_allowance() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NEW.remaining<0 OR NEW.remaining>50 OR NEW.cycle_end <> NEW.cycle_start + interval '30 days' THEN RAISE EXCEPTION 'Invalid monthly allowance'; END IF; RETURN NEW; END $$;
CREATE TRIGGER allowance_validate BEFORE INSERT OR UPDATE ON public.subscription_registration_allowances FOR EACH ROW EXECUTE FUNCTION public.validate_launch_allowance();
CREATE FUNCTION public.validate_launch_order() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NEW.amount<>97 OR NEW.provider NOT IN ('openpix','mercadopago','abacate') OR NEW.status NOT IN ('pending','paid','cancelled') THEN RAISE EXCEPTION 'Invalid launch order'; END IF;
 IF TG_OP='UPDATE' AND (NEW.user_id<>OLD.user_id OR NEW.provider<>OLD.provider OR NEW.payment_id<>OLD.payment_id OR (OLD.status='paid' AND NEW.status<>'paid')) THEN RAISE EXCEPTION 'Immutable payment identity'; END IF; RETURN NEW; END $$;
CREATE TRIGGER launch_order_validate BEFORE INSERT OR UPDATE ON public.subscription_launch_orders FOR EACH ROW EXECUTE FUNCTION public.validate_launch_order();
CREATE FUNCTION public.activate_launch_subscription(p_provider text,p_payment_id text,p_amount numeric,p_paid_at timestamptz) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.subscription_launch_orders%ROWTYPE; a public.subscription_registration_allowances%ROWTYPE; s public.subscriptions%ROWTYPE; v_uid uuid; v_start timestamptz;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 SELECT user_id INTO v_uid FROM public.subscription_launch_orders WHERE provider=p_provider AND payment_id=p_payment_id;
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Payment order not found'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=v_uid FOR UPDATE;
 SELECT * INTO o FROM public.subscription_launch_orders WHERE provider=p_provider AND payment_id=p_payment_id FOR UPDATE;
 IF p_amount IS DISTINCT FROM o.amount OR p_amount<>97 OR p_paid_at IS NULL OR p_paid_at>now()+interval '5 minutes' OR p_paid_at<o.created_at-interval '5 minutes' THEN RAISE EXCEPTION 'Payment amount or date mismatch'; END IF;
 IF o.status='paid' THEN RETURN jsonb_build_object('success',true,'duplicate',true); END IF;
 IF o.status<>'pending' THEN RAISE EXCEPTION 'Payment order is not pending'; END IF;
 SELECT * INTO a FROM public.subscription_registration_allowances WHERE user_id=o.user_id FOR UPDATE;
 SELECT * INTO s FROM public.subscriptions WHERE user_id=o.user_id FOR UPDATE;
 IF s.status='active' AND (s.expires_at IS NULL OR s.expires_at>now()) AND a.user_id IS NULL THEN RAISE EXCEPTION 'Legacy active subscription requires explicit migration'; END IF;
 IF a.user_id IS NOT NULL AND a.cycle_end>now() THEN RAISE EXCEPTION 'Current paid cycle has not ended'; END IF;
 v_start:=p_paid_at;
 IF a.user_id IS NOT NULL AND v_start<=a.cycle_start THEN RAISE EXCEPTION 'Out of order payment requires reconciliation'; END IF;
 UPDATE public.subscription_launch_orders SET status='paid',paid_at=p_paid_at WHERE id=o.id;
 INSERT INTO public.subscriptions(user_id,status,plan_type,started_at,expires_at,auto_renew,payment_provider,payment_provider_subscription_id,amount,currency,last_credit_grant_at)
 VALUES(o.user_id,'active','pro',v_start,v_start+interval '30 days',false,p_provider,p_payment_id,97,'BRL',now())
 ON CONFLICT(user_id) DO UPDATE SET status='active',plan_type='pro',started_at=EXCLUDED.started_at,expires_at=EXCLUDED.expires_at,auto_renew=false,payment_provider=p_provider,payment_provider_subscription_id=p_payment_id,amount=97,currency='BRL',last_credit_grant_at=now();
 INSERT INTO public.subscription_registration_allowances(user_id,order_id,remaining,cycle_start,cycle_end) VALUES(o.user_id,o.id,50,v_start,v_start+interval '30 days')
 ON CONFLICT(user_id) DO UPDATE SET order_id=o.id,remaining=50,cycle_start=v_start,cycle_end=v_start+interval '30 days';
 RETURN jsonb_build_object('success',true,'duplicate',false,'allowance',50,'expires_at',v_start+interval '30 days');
END $$;
REVOKE ALL ON FUNCTION public.activate_launch_subscription(text,text,numeric,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.activate_launch_subscription(text,text,numeric,timestamptz) TO service_role;
ALTER FUNCTION public.grant_monthly_subscription_credits(uuid) RENAME TO grant_legacy_monthly_subscription_credits;
REVOKE ALL ON FUNCTION public.grant_legacy_monthly_subscription_credits(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.grant_legacy_monthly_subscription_credits(uuid) TO service_role;
CREATE FUNCTION public.grant_monthly_subscription_credits(p_user_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF EXISTS(SELECT 1 FROM public.subscription_registration_allowances WHERE user_id=p_user_id) THEN RETURN jsonb_build_object('success',true,'skipped',true,'reason','Allowance granted only by verified paid cycle'); END IF;
 RETURN public.grant_legacy_monthly_subscription_credits(p_user_id);
END $$;
REVOKE ALL ON FUNCTION public.grant_monthly_subscription_credits(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.grant_monthly_subscription_credits(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.use_credits_for_registration(p_user_id uuid,p_credits_needed integer DEFAULT 1) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r integer; b integer; frozen boolean; a public.subscription_registration_allowances%ROWTYPE; used_a integer:=0; used_r integer:=0; used_b integer:=0; needed integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' AND (auth.uid() IS NULL OR (auth.uid()<>p_user_id AND NOT public.can_moderator_manage_user(p_user_id))) THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF p_credits_needed IS NULL OR p_credits_needed<1 THEN RAISE EXCEPTION 'Invalid credit quantity'; END IF;
 SELECT COALESCE(credits,0) INTO r FROM public.profiles WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
 SELECT * INTO a FROM public.subscription_registration_allowances WHERE user_id=p_user_id FOR UPDATE;
 SELECT credits,is_frozen INTO b,frozen FROM public.subscription_credits_bonus WHERE user_id=p_user_id FOR UPDATE;
 b:=COALESCE(b,0); frozen:=COALESCE(frozen,true);
 IF a.cycle_start<=now() AND a.cycle_end>now() AND EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=p_user_id AND status='active' AND plan_type='pro') THEN used_a:=LEAST(a.remaining,p_credits_needed); END IF;
 needed:=p_credits_needed-used_a;
 IF (r+(CASE WHEN frozen THEN 0 ELSE b END))<needed THEN RETURN jsonb_build_object('success',false,'error','Créditos insuficientes'); END IF;
 used_r:=LEAST(r,needed); used_b:=needed-used_r;
 IF used_a>0 THEN UPDATE public.subscription_registration_allowances SET remaining=remaining-used_a WHERE user_id=p_user_id; END IF;
 IF used_r>0 THEN UPDATE public.profiles SET credits=credits-used_r WHERE id=p_user_id; END IF;
 IF used_b>0 THEN UPDATE public.subscription_credits_bonus SET credits=credits-used_b,updated_at=now() WHERE user_id=p_user_id; END IF;
 INSERT INTO public.user_activity_logs(user_id,action,metadata) VALUES(p_user_id,'credits_used_for_registration',jsonb_build_object('allowance_used',used_a,'regular_credits_used',used_r,'bonus_credits_used',used_b,'total_used',p_credits_needed));
 RETURN jsonb_build_object('success',true,'allowance_used',used_a,'regular_credits_used',used_r,'bonus_credits_used',used_b,'remaining_regular',r-used_r,'remaining_bonus',b-used_b);
END $$;
REVOKE ALL ON FUNCTION public.use_credits_for_registration(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.use_credits_for_registration(uuid,integer) TO authenticated,service_role;
CREATE FUNCTION public.consume_launch_registration() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE result jsonb; BEGIN
 IF EXISTS(SELECT 1 FROM public.subscription_registration_allowances WHERE user_id=NEW.user_id) THEN
 result:=public.use_credits_for_registration(NEW.user_id,1);
 IF NOT COALESCE((result->>'success')::boolean,false) THEN RAISE EXCEPTION 'Créditos insuficientes'; END IF;
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER consume_launch_registration BEFORE INSERT ON public.author_registrations FOR EACH ROW EXECUTE FUNCTION public.consume_launch_registration();
CREATE FUNCTION public.get_registration_balance(p_user_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r integer; b integer; monthly integer:=0; is_launch boolean; ends timestamptz; BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' AND (auth.uid() IS NULL OR (auth.uid()<>p_user_id AND NOT public.can_moderator_manage_user(p_user_id))) THEN RAISE EXCEPTION 'Access denied'; END IF;
 SELECT COALESCE(credits,0) INTO r FROM public.profiles WHERE id=p_user_id;
 SELECT CASE WHEN is_frozen THEN 0 ELSE credits END INTO b FROM public.subscription_credits_bonus WHERE user_id=p_user_id;
 SELECT true,cycle_end,CASE WHEN cycle_start<=now() AND cycle_end>now() AND EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=p_user_id AND status='active' AND plan_type='pro') THEN remaining ELSE 0 END INTO is_launch,ends,monthly FROM public.subscription_registration_allowances WHERE user_id=p_user_id;
 RETURN jsonb_build_object('credits',COALESCE(r,0)+CASE WHEN COALESCE(is_launch,false) THEN COALESCE(b,0)+COALESCE(monthly,0) ELSE 0 END,'standalone_credits',COALESCE(r,0),'monthly_remaining',COALESCE(monthly,0),'cycle_end',ends,'is_launch',COALESCE(is_launch,false));
END $$;
REVOKE ALL ON FUNCTION public.get_registration_balance(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_registration_balance(uuid) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.validate_launch_allowance(),public.validate_launch_order(),public.consume_launch_registration() FROM PUBLIC,anon,authenticated;