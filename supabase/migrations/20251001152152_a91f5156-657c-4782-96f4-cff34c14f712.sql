
-- Criar perfil para o usuário fabricionedino@gmail.com mantendo todo seu conteúdo
INSERT INTO public.profiles (id, email, name, credits, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  0,
  created_at
FROM auth.users
WHERE email = 'fabricionedino@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Criar subscription trial de 15 dias se não existir
INSERT INTO public.subscriptions (user_id, status, plan_type, started_at, expires_at, auto_renew, currency)
SELECT 
  id,
  'trial',
  'trial',
  NOW(),
  NOW() + INTERVAL '15 days',
  false,
  'BRL'
FROM auth.users
WHERE email = 'fabricionedino@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.subscriptions 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'fabricionedino@gmail.com')
);
