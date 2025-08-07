-- Criar tabela para gerenciar status das funções do menu
CREATE TABLE public.menu_functions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('coming_soon', 'beta', 'available')),
  icon TEXT,
  route TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.menu_functions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admins gerenciarem
CREATE POLICY "Admins can manage menu functions" 
ON public.menu_functions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Política para usuários autenticados visualizarem
CREATE POLICY "Authenticated users can view menu functions" 
ON public.menu_functions 
FOR SELECT 
TO authenticated
USING (true);

-- Função para inserir dados iniciais das funções existentes
CREATE OR REPLACE FUNCTION public.populate_menu_functions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir funções existentes baseadas no sidebar atual
  INSERT INTO public.menu_functions (function_key, name, description, icon, route, status) VALUES
  ('dashboard', 'Dashboard', 'Painel principal do usuário', 'LayoutDashboard', '/dashboard', 'available'),
  ('composer', 'Compositor', 'Ferramenta de composição musical', 'Music', '/composer', 'available'),
  ('author-registration', 'Registro de Autor', 'Registro de obras autorais', 'FileText', '/author-registration', 'available'),
  ('cifrador', 'Cifrador', 'Ferramenta de cifragem musical', 'Hash', '/cifrador', 'available'),
  ('bases', 'Bases Musicais', 'Biblioteca de bases musicais', 'Volume2', '/bases', 'available'),
  ('folders', 'Pastas', 'Organização de arquivos', 'Folder', '/folders', 'available'),
  ('drafts', 'Rascunhos', 'Rascunhos salvos', 'Edit', '/drafts', 'available'),
  ('partnerships', 'Parcerias', 'Colaborações musicais', 'Users', '/partnerships', 'available'),
  ('tutorials', 'Tutoriais', 'Vídeos educativos', 'PlayCircle', '/tutorials', 'available'),
  ('settings', 'Configurações', 'Configurações do usuário', 'Settings', '/settings', 'available'),
  ('trash', 'Lixeira', 'Itens removidos', 'Trash2', '/trash', 'available'),
  ('admin', 'Administração', 'Painel administrativo', 'Shield', '/admin', 'available'),
  ('moderator', 'Moderação', 'Painel de moderação', 'UserCheck', '/moderator', 'available')
  ON CONFLICT (function_key) DO NOTHING;
END;
$$;

-- Executar a função para popular dados iniciais
SELECT public.populate_menu_functions();

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_menu_functions_updated_at
  BEFORE UPDATE ON public.menu_functions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para obter status de uma função específica
CREATE OR REPLACE FUNCTION public.get_function_status(p_function_key TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT status 
  FROM public.menu_functions 
  WHERE function_key = p_function_key;
$$;