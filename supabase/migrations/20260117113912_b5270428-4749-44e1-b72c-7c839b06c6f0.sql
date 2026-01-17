
-- Associar o usuário luisccandrady@hotmail.com ao moderador acordeondeourobrasil@gmail.com
INSERT INTO moderator_users (user_id, moderator_id, created_at, updated_at)
VALUES (
  '826efa2d-11e3-4a76-9798-fa737941fd4c',  -- Luis Carlos (usuário)
  'a3eaa39e-9e7f-4f69-9494-4cae526b05e8',  -- Edinaldo Nedino (moderador)
  now(),
  now()
);
