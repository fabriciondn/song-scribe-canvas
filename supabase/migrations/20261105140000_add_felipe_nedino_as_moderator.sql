-- Promover Felipe Nedino a parceiro, sem alterar créditos ou plano.
-- Idempotente: execuções repetidas não geram alterações nem logs duplicados.
DO $$
DECLARE
  v_user_id UUID;
  v_existing_role TEXT;
  v_existing_permissions JSONB;
  v_permissions JSONB := '["manage_user_credits", "create_users"]'::jsonb;
BEGIN
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE LOWER(email) = 'felipenedino88@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE LOWER(email) = 'felipenedino88@gmail.com'
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com e-mail felipenedino88@gmail.com não foi encontrado no banco de dados.';
  END IF;

  SELECT role, permissions INTO v_existing_role, v_existing_permissions
  FROM public.admin_users
  WHERE user_id = v_user_id
  FOR UPDATE;

  -- Não rebaixar acidentalmente um administrador existente.
  IF v_existing_role IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Usuário já possui função administrativa (%). Promoção cancelada.', v_existing_role;
  END IF;

  IF v_existing_role IS DISTINCT FROM 'moderator'
     OR v_existing_permissions IS DISTINCT FROM v_permissions THEN
    INSERT INTO public.admin_users (user_id, role, permissions, created_at, updated_at)
    VALUES (v_user_id, 'moderator', v_permissions, now(), now())
    ON CONFLICT (user_id) DO UPDATE
      SET role = EXCLUDED.role,
          permissions = EXCLUDED.permissions,
          updated_at = now();

    INSERT INTO public.user_activity_logs (user_id, action, metadata)
    VALUES (
      v_user_id,
      'user_promoted_to_moderator_via_migration',
      jsonb_build_object(
        'promoted_at', now(),
        'email', 'felipenedino88@gmail.com',
        'role', 'moderator',
        'previous_role', v_existing_role
      )
    );

    RAISE NOTICE 'Felipe Nedino (%) ativado como parceiro.', v_user_id;
  ELSE
    RAISE NOTICE 'Felipe Nedino (%) já está configurado como parceiro. Nenhuma alteração necessária.', v_user_id;
  END IF;
END $$;
