-- Create discount coupons table
CREATE TABLE public.discount_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_percentage NUMERIC NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  applies_to TEXT[] DEFAULT ARRAY['pendrive', 'pro']::TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coupon usage log table
CREATE TABLE public.coupon_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.discount_coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  subscription_type TEXT NOT NULL,
  original_amount NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL,
  final_amount NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for discount_coupons
CREATE POLICY "Admins can manage all coupons"
ON public.discount_coupons
FOR ALL
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Public can view active coupons for validation"
ON public.discount_coupons
FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- RLS policies for coupon_usage_logs
CREATE POLICY "Admins can view all coupon usage"
ON public.coupon_usage_logs
FOR ALL
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own coupon usage"
ON public.coupon_usage_logs
FOR SELECT
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_discount_coupons_updated_at
BEFORE UPDATE ON public.discount_coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for coupon code lookups
CREATE INDEX idx_discount_coupons_code ON public.discount_coupons(code);
CREATE INDEX idx_coupon_usage_logs_coupon_id ON public.coupon_usage_logs(coupon_id);