-- Adicionar constraint único no user_id para permitir upsert
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);