-- Criar função para administradores atualizarem créditos de usuários
CREATE OR REPLACE FUNCTION public.admin_update_user_credits(
  target_user_id uuid,
  new_credits integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Atualizar os créditos do usuário alvo
  UPDATE public.profiles 
  SET credits = new_credits,
      updated_at = now()
  WHERE id = target_user_id;

  -- Log da atividade
  INSERT INTO public.user_activity_logs (user_id, action, metadata)
  VALUES (
    target_user_id, 
    'credits_updated_by_admin', 
    jsonb_build_object(
      'admin_user_id', auth.uid(),
      'old_credits', (SELECT credits FROM public.profiles WHERE id = target_user_id),
      'new_credits', new_credits
    )
  );
END;
$$;

-- Criar política RLS para permitir que admins atualizem créditos
CREATE POLICY "Admins can update user credits" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);