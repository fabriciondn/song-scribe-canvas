INSERT INTO public.system_notifications (title, description, type, is_active)
VALUES 
  ('Compositor: Alternar tema rapidamente', 'Agora você pode alternar entre modo claro e escuro diretamente nas configurações do painel de composição.', 'feature', true),
  ('Compositor: Suas preferências são salvas', 'As configurações do painel (botão de gravação, player, etc.) agora são salvas e mantidas até você alterar manualmente.', 'improvement', true),
  ('Compositor: Navegação de rascunhos aprimorada', 'Ao abrir um rascunho, ele carrega direto no editor. Ao sair, você volta para a lista de rascunhos recentes.', 'improvement', true),
  ('Compositor: Música não para ao ocultar player', 'Agora ao ocultar a área do player, a base musical continua tocando normalmente.', 'fix', true),
  ('Compositor: Experiência mais limpa', 'Removemos a mensagem de auto-save para não interromper seu fluxo criativo.', 'fix', true);