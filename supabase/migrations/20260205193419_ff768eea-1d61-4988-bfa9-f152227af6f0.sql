-- Remover política antiga de INSERT
DROP POLICY IF EXISTS "Public can insert analytics events" ON public.offer_page_analytics;

-- Criar nova política totalmente permissiva para INSERT (para usuários anônimos e autenticados)
CREATE POLICY "Allow public insert analytics"
ON public.offer_page_analytics
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Garantir que a tabela tem RLS habilitado
ALTER TABLE public.offer_page_analytics ENABLE ROW LEVEL SECURITY;