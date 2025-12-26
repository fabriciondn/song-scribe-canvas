-- Função para retroativamente conceder acordes para ações já completadas
CREATE OR REPLACE FUNCTION public.backfill_user_acordes(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_action RECORD;
  v_already_completed BOOLEAN;
  v_has_photo BOOLEAN;
  v_works_count INTEGER;
  v_total_awarded INTEGER := 0;
  v_result jsonb;
BEGIN
  -- Garantir que o usuário tenha registro em user_acordes
  INSERT INTO user_acordes (user_id, total_acordes, redeemed_acordes)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Verificar se usuário tem foto de perfil
  SELECT avatar_url IS NOT NULL AND avatar_url != '' INTO v_has_photo
  FROM profiles WHERE id = p_user_id;

  IF v_has_photo THEN
    -- Verificar se já recebeu acordes por foto
    SELECT EXISTS (
      SELECT 1 FROM acorde_history ah
      JOIN acorde_actions aa ON ah.action_id = aa.id
      WHERE ah.user_id = p_user_id AND aa.action_key = 'profile_photo'
    ) INTO v_already_completed;

    IF NOT v_already_completed THEN
      -- Conceder acordes por foto de perfil
      FOR v_action IN SELECT * FROM acorde_actions WHERE action_key = 'profile_photo' AND is_active = true LOOP
        INSERT INTO acorde_history (user_id, action_id, acordes_earned, description)
        VALUES (p_user_id, v_action.id, v_action.acordes_reward, 'Retroativo: ' || v_action.name);

        UPDATE user_acordes
        SET total_acordes = total_acordes + v_action.acordes_reward,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        v_total_awarded := v_total_awarded + v_action.acordes_reward;
      END LOOP;
    END IF;
  END IF;

  -- Verificar obras registradas
  SELECT COUNT(*) INTO v_works_count
  FROM author_registrations
  WHERE user_id = p_user_id AND status IN ('registered', 'completed');

  IF v_works_count > 0 THEN
    -- Verificar quantas vezes já recebeu acordes por registro
    FOR v_action IN SELECT * FROM acorde_actions WHERE action_key = 'register_work' AND is_active = true LOOP
      DECLARE
        v_already_awarded INTEGER;
        v_can_award INTEGER;
        v_max_awards INTEGER;
      BEGIN
        SELECT COUNT(*) INTO v_already_awarded
        FROM acorde_history
        WHERE user_id = p_user_id AND action_id = v_action.id;

        v_max_awards := COALESCE(v_action.max_per_user, v_works_count);
        v_can_award := LEAST(v_works_count, v_max_awards) - v_already_awarded;

        IF v_can_award > 0 THEN
          FOR i IN 1..v_can_award LOOP
            INSERT INTO acorde_history (user_id, action_id, acordes_earned, description)
            VALUES (p_user_id, v_action.id, v_action.acordes_reward, 'Retroativo: ' || v_action.name || ' #' || (v_already_awarded + i));

            UPDATE user_acordes
            SET total_acordes = total_acordes + v_action.acordes_reward,
                updated_at = NOW()
            WHERE user_id = p_user_id;

            v_total_awarded := v_total_awarded + v_action.acordes_reward;
          END LOOP;
        END IF;
      END;
    END LOOP;
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'total_awarded', v_total_awarded,
    'user_id', p_user_id
  );

  RETURN v_result;
END;
$$;

-- Função para fazer backfill de todos os usuários (uso administrativo)
CREATE OR REPLACE FUNCTION public.backfill_all_users_acordes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user RECORD;
  v_total_users INTEGER := 0;
  v_total_acordes INTEGER := 0;
  v_result jsonb;
  v_user_result jsonb;
BEGIN
  FOR v_user IN SELECT id FROM profiles LOOP
    v_user_result := backfill_user_acordes(v_user.id);
    v_total_users := v_total_users + 1;
    v_total_acordes := v_total_acordes + COALESCE((v_user_result->>'total_awarded')::INTEGER, 0);
  END LOOP;

  v_result := jsonb_build_object(
    'success', true,
    'total_users_processed', v_total_users,
    'total_acordes_awarded', v_total_acordes
  );

  RETURN v_result;
END;
$$;