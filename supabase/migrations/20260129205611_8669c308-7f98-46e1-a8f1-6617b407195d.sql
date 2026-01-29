-- Create table to store offer page settings including Meta Pixel code
CREATE TABLE IF NOT EXISTS public.offer_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offer_page_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage offer page settings"
  ON public.offer_page_settings
  FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

-- Anyone can read settings (needed for the pixel to load on the public page)
CREATE POLICY "Public can read offer page settings"
  ON public.offer_page_settings
  FOR SELECT
  USING (true);

-- Insert default empty Meta Pixel setting
INSERT INTO public.offer_page_settings (setting_key, setting_value)
VALUES ('meta_pixel_code', '')
ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_offer_page_settings_updated_at
  BEFORE UPDATE ON public.offer_page_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();