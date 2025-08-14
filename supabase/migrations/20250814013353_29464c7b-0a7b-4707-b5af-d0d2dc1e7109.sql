-- Limpar registros duplicados mantendo apenas o mais recente
WITH duplicates AS (
  SELECT id, user_id, 
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM public.subscriptions
)
DELETE FROM public.subscriptions 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Agora adicionar o constraint único
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);