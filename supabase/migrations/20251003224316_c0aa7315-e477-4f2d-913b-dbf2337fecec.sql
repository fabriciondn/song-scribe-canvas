-- Criar política para permitir visualização pública limitada de perfis na landing page
CREATE POLICY "Public can view basic composer info for landing page"
ON public.profiles
FOR SELECT
TO anon
USING (
  name IS NOT NULL
);