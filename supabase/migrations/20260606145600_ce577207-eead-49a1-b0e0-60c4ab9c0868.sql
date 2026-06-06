
CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  platform text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  total_budget numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_campaign_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  cost_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_campaign_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  result_date date NOT NULL DEFAULT CURRENT_DATE,
  leads integer NOT NULL DEFAULT 0,
  sales integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  impressions integer,
  clicks integer,
  cpm numeric,
  ctr numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaign_costs TO authenticated;
GRANT ALL ON public.marketing_campaign_costs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaign_results TO authenticated;
GRANT ALL ON public.marketing_campaign_results TO service_role;

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaign_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaign_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaigns" ON public.marketing_campaigns
  FOR ALL TO authenticated
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins manage campaign costs" ON public.marketing_campaign_costs
  FOR ALL TO authenticated
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins manage campaign results" ON public.marketing_campaign_results
  FOR ALL TO authenticated
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

CREATE TRIGGER marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_marketing_costs_campaign ON public.marketing_campaign_costs(campaign_id);
CREATE INDEX idx_marketing_results_campaign ON public.marketing_campaign_results(campaign_id);
CREATE INDEX idx_marketing_campaigns_dates ON public.marketing_campaigns(start_date, end_date);
