-- Adicionar coluna audience_type na tabela tutorials
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS audience_type TEXT DEFAULT 'user';

-- Atualizar políticas de RLS para tutoriais
DROP POLICY IF EXISTS "Admins can manage tutorials" ON public.tutorials;
DROP POLICY IF EXISTS "Users can view active tutorials" ON public.tutorials;
DROP POLICY IF EXISTS "Admins can manage all tutorials" ON public.tutorials;
DROP POLICY IF EXISTS "Users can view active user tutorials" ON public.tutorials;
DROP POLICY IF EXISTS "Admins can view active staff tutorials" ON public.tutorials;

-- Criar novas políticas baseadas na tabela admin_users
-- Apenas admins podem gerenciar qualquer tutorial
CREATE POLICY "Admins can manage all tutorials" 
ON public.tutorials 
FOR ALL 
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'admin'));

-- Usuários autenticados podem ver apenas tutoriais 'user' ativos
CREATE POLICY "Users can view active user tutorials" 
ON public.tutorials 
FOR SELECT 
TO authenticated
USING (is_active = true AND audience_type = 'user');

-- Admins podem ver todos os tutoriais ativos (incluindo 'staff')
CREATE POLICY "Admins can view active staff tutorials" 
ON public.tutorials 
FOR SELECT 
TO authenticated
USING (is_active = true AND (audience_type = 'user' OR audience_type = 'staff') AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'admin'));

GRANT ALL ON public.tutorials TO authenticated;
GRANT ALL ON public.tutorials TO service_role;
