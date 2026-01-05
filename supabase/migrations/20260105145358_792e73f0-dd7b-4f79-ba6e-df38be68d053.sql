-- Adicionar notificação sobre a atualização de permissões de admin
INSERT INTO public.system_notifications (title, description, type, is_active)
VALUES (
  'Admins podem registrar músicas para qualquer usuário',
  'Agora administradores podem realizar registros autorais em nome de qualquer usuário da plataforma, facilitando o suporte e gestão.',
  'feature',
  true
);