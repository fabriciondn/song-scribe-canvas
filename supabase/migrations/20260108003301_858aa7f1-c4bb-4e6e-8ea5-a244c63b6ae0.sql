-- Registrar notificações das últimas melhorias no compositor mobile
INSERT INTO public.system_notifications (title, description, type, is_active)
VALUES
  (
    'Compositor (mobile): texto até o final',
    'Ao ocultar a área inferior (player), ajustamos o padding para você conseguir ver e rolar a letra até o fim, bem próximo da barra inferior.',
    'fix',
    true
  ),
  (
    'Compositor (mobile): switches alinhados',
    'Ajustamos o visual dos controles de seção nas configurações, deixando os switches mais consistentes e alinhados.',
    'update',
    true
  );
