-- Inserir o vínculo na tabela moderator_users
INSERT INTO public.moderator_users (moderator_id, user_id)
VALUES ('a3eaa39e-9e7f-4f69-9494-4cae526b05e8', 'b8e94327-4e2a-4ccf-8315-77814aa9b4a8')
ON CONFLICT (user_id) DO UPDATE 
SET moderator_id = EXCLUDED.moderator_id;

-- Atualizar o nome no perfil do Thiago
UPDATE public.profiles
SET name = 'Thiago Lima Cortes'
WHERE id = 'b8e94327-4e2a-4ccf-8315-77814aa9b4a8';