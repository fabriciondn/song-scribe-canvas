-- Notificações das melhorias anteriores que faltavam
INSERT INTO public.system_notifications (title, description, type, is_active)
VALUES
  (
    'Compositor: Mais espaço para escrever',
    'As informações de pasta e o botão "Compor em Parceria" agora ficam nas configurações do painel, liberando mais espaço para você focar na sua letra.',
    'improvement',
    true
  ),
  (
    'Compositor: Menos distrações',
    'Removemos a mensagem de "Rascunho restaurado automaticamente" para uma experiência mais limpa e sem interrupções.',
    'fix',
    true
  );