-- Política para permitir inserção de conversões
DROP POLICY IF EXISTS "Service role can insert conversions" ON affiliate_conversions;
CREATE POLICY "Service role can insert conversions" ON affiliate_conversions
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir atualização de total_registrations
DROP POLICY IF EXISTS "Service role can update affiliates" ON affiliates;
CREATE POLICY "Service role can update affiliates" ON affiliates
  FOR UPDATE
  USING (true);

-- Função para processar registro de afiliado de forma atômica
CREATE OR REPLACE FUNCTION process_affiliate_registration(
  p_affiliate_code TEXT,
  p_user_id UUID
) RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id UUID;
  v_current_registrations INTEGER;
  v_click_id UUID;
BEGIN
  -- Buscar afiliado (tentar diferentes formatos)
  SELECT id, total_registrations INTO v_affiliate_id, v_current_registrations
  FROM affiliates
  WHERE (
    affiliate_code = p_affiliate_code 
    OR affiliate_code = 'compuse-' || p_affiliate_code
    OR affiliate_code = regexp_replace(p_affiliate_code, '^compuse-', '')
  )
  AND status = 'approved'
  LIMIT 1;
  
  IF v_affiliate_id IS NULL THEN
    RAISE NOTICE 'Afiliado não encontrado: %', p_affiliate_code;
    RETURN FALSE;
  END IF;
  
  -- Criar conversão
  INSERT INTO affiliate_conversions (
    affiliate_id, user_id, type, reference_id
  ) VALUES (
    v_affiliate_id, p_user_id, 'author_registration', p_user_id
  )
  ON CONFLICT DO NOTHING;
  
  -- Incrementar total
  UPDATE affiliates
  SET total_registrations = COALESCE(total_registrations, 0) + 1,
      updated_at = NOW()
  WHERE id = v_affiliate_id;
  
  -- Buscar último clique não convertido e marcar como convertido
  SELECT id INTO v_click_id
  FROM affiliate_clicks
  WHERE affiliate_id = v_affiliate_id
    AND converted = FALSE
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_click_id IS NOT NULL THEN
    UPDATE affiliate_clicks
    SET converted = TRUE
    WHERE id = v_click_id;
  END IF;
  
  -- Atualizar perfil do usuário
  UPDATE profiles
  SET moderator_notes = 'Indicado por: ' || p_affiliate_code
  WHERE id = p_user_id;
  
  RAISE NOTICE 'Conversão processada com sucesso para afiliado: %', v_affiliate_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao processar conversão: %', SQLERRM;
    RETURN FALSE;
END;
$$;