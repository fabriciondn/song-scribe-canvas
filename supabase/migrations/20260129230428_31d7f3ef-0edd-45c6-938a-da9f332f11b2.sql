-- Inserir 2 cliques de WhatsApp que não foram registrados pelo tracking
INSERT INTO public.offer_page_analytics (event_type, event_data, session_id, user_agent, referrer, created_at)
VALUES 
  ('button_click', '{"button": "whatsapp"}'::jsonb, 'manual-admin-1', 'Entrada manual - clique real não rastreado', null, NOW()),
  ('button_click', '{"button": "whatsapp"}'::jsonb, 'manual-admin-2', 'Entrada manual - clique real não rastreado', null, NOW());