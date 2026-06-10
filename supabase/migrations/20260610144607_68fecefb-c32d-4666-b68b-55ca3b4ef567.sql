
CREATE TABLE public.portfolio_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  composer_name TEXT NOT NULL,
  composer_photo_url TEXT,
  style TEXT,
  audio_before_url TEXT,
  audio_after_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portfolio_works TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_works TO authenticated;
GRANT ALL ON public.portfolio_works TO service_role;
ALTER TABLE public.portfolio_works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active works" ON public.portfolio_works FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage works" ON public.portfolio_works FOR ALL TO authenticated
  USING (public.is_user_admin(auth.uid())) WITH CHECK (public.is_user_admin(auth.uid()));

CREATE TABLE public.portfolio_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  audio_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portfolio_testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_testimonials TO authenticated;
GRANT ALL ON public.portfolio_testimonials TO service_role;
ALTER TABLE public.portfolio_testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active testimonials" ON public.portfolio_testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage testimonials" ON public.portfolio_testimonials FOR ALL TO authenticated
  USING (public.is_user_admin(auth.uid())) WITH CHECK (public.is_user_admin(auth.uid()));

CREATE TABLE public.portfolio_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portfolio_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_settings TO authenticated;
GRANT ALL ON public.portfolio_settings TO service_role;
ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view settings" ON public.portfolio_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.portfolio_settings FOR ALL TO authenticated
  USING (public.is_user_admin(auth.uid())) WITH CHECK (public.is_user_admin(auth.uid()));

INSERT INTO public.portfolio_settings(key, value) VALUES
  ('hero_title', 'Sua música merece soar profissional.'),
  ('hero_subtitle', 'Ouça o antes e o depois. Decida com os ouvidos.'),
  ('whatsapp_number', '5511999999999'),
  ('whatsapp_message', 'Olá! Vi o portfólio da Compuse e quero produzir minha música.'),
  ('stat_1_value', '+120'), ('stat_1_label', 'Músicas produzidas'),
  ('stat_2_value', '9 anos'), ('stat_2_label', 'De estúdio'),
  ('stat_3_value', '4.9★'), ('stat_3_label', 'Avaliação dos clientes')
ON CONFLICT (key) DO NOTHING;
