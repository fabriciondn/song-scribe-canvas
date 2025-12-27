-- Adicionar usuário João Roberto ao moderador Felipe Tima
INSERT INTO public.moderator_users (moderator_id, user_id)
VALUES (
  'd32771fd-8797-40e8-88cc-c99475537550', -- felipetima88@gmail.com
  'd0c70910-4c36-4f76-a313-07931380b51a'  -- joaotecladistatocaecanta2017@gmail.com
)
ON CONFLICT DO NOTHING;