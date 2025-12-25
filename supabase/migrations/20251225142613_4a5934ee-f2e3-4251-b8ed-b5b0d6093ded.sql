-- Tabela de notificações do sistema (atualizações, novas funções, correções)
CREATE TABLE public.system_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'update', -- 'update', 'feature', 'fix', 'announcement'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Tabela para rastrear quais notificações cada usuário já leu
CREATE TABLE public.user_notification_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_id UUID NOT NULL REFERENCES public.system_notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

-- Habilitar RLS
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

-- Políticas para system_notifications (todos podem ler notificações ativas)
CREATE POLICY "Anyone can view active notifications" 
ON public.system_notifications 
FOR SELECT 
USING (is_active = true);

-- Políticas para user_notification_reads
CREATE POLICY "Users can view their own reads" 
ON public.user_notification_reads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark notifications as read" 
ON public.user_notification_reads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reads" 
ON public.user_notification_reads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Inserir algumas notificações iniciais de exemplo
INSERT INTO public.system_notifications (title, description, type) VALUES
('Nova Central de Notificações', 'Agora você pode ver todas as atualizações do sistema em um só lugar!', 'feature'),
('Melhorias no Dashboard', 'O dashboard foi redesenhado para melhor experiência.', 'update');