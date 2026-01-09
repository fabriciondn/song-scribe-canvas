-- Tabela para configurações do sorteio
CREATE TABLE public.raffle_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Sorteio da Guitarra',
  description TEXT,
  total_numbers INTEGER NOT NULL DEFAULT 1000,
  min_number INTEGER NOT NULL DEFAULT 1,
  max_number INTEGER NOT NULL DEFAULT 1000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_visible_in_menu BOOLEAN NOT NULL DEFAULT true,
  draw_date TIMESTAMP WITH TIME ZONE,
  prize_description TEXT,
  prize_image_url TEXT,
  rules TEXT,
  base_numbers_for_pro INTEGER NOT NULL DEFAULT 1,
  numbers_per_credit INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para números reservados no sorteio
CREATE TABLE public.raffle_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raffle_id UUID NOT NULL REFERENCES public.raffle_settings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  number INTEGER NOT NULL,
  reserved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(raffle_id, number)
);

-- Enable RLS
ALTER TABLE public.raffle_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_reservations ENABLE ROW LEVEL SECURITY;

-- Políticas para raffle_settings (somente admins podem modificar, todos podem ler)
CREATE POLICY "Anyone can view active raffle settings"
ON public.raffle_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage raffle settings"
ON public.raffle_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Políticas para raffle_reservations
CREATE POLICY "Users can view all reservations"
ON public.raffle_reservations
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reservations"
ON public.raffle_reservations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reservations"
ON public.raffle_reservations
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reservations"
ON public.raffle_reservations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_raffle_settings_updated_at
BEFORE UPDATE ON public.raffle_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração padrão do sorteio
INSERT INTO public.raffle_settings (
  name,
  description,
  total_numbers,
  prize_description,
  rules,
  draw_date
) VALUES (
  'Sorteio da Guitarra Fender',
  'Concorra a uma guitarra Fender Stratocaster exclusiva!',
  1000,
  'Guitarra Fender Stratocaster Player Series',
  'Para participar você precisa ser assinante PRO. Cada assinante PRO tem direito a 1 número base. A cada crédito comprado, você ganha +1 número para escolher.',
  '2026-03-01 00:00:00+00'
);