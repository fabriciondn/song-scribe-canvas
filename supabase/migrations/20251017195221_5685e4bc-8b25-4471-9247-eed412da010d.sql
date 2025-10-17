-- Criar perfil para o usuário que fez login via Google mas não teve perfil criado
INSERT INTO public.profiles (id, name, email, credits)
VALUES (
  '5bf8126e-5568-46a1-b150-555de78d0879',
  'daniel santos',
  'ndbbusnies@gmail.com',
  0
)
ON CONFLICT (id) DO UPDATE
SET 
  name = COALESCE(EXCLUDED.name, profiles.name),
  email = COALESCE(EXCLUDED.email, profiles.email);

-- Criar subscription trial para o usuário
INSERT INTO public.subscriptions (
  user_id,
  status,
  plan_type,
  started_at,
  expires_at,
  auto_renew,
  currency
) VALUES (
  '5bf8126e-5568-46a1-b150-555de78d0879',
  'trial',
  'trial',
  NOW(),
  NOW() + INTERVAL '15 days',
  false,
  'BRL'
)
ON CONFLICT DO NOTHING;