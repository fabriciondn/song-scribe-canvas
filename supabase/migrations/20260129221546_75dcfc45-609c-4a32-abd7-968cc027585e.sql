-- Corrigir política de INSERT para ser PERMISSIVE (não RESTRICTIVE)
-- Remover a política restritiva atual
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.offer_page_analytics;

-- Criar nova política PERMISSIVE para inserção pública
CREATE POLICY "Public can insert analytics events"
ON public.offer_page_analytics
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Também verificar a política de SELECT do admin
DROP POLICY IF EXISTS "Only admins can read analytics" ON public.offer_page_analytics;

CREATE POLICY "Admins can read analytics"
ON public.offer_page_analytics
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
));