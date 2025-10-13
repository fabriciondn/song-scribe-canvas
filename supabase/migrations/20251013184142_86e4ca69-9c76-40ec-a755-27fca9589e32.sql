-- Adicionar logging detalhado e corrigir a função process_affiliate_registration

-- Drop e recriar a função com logging melhorado
DROP FUNCTION IF EXISTS public.process_affiliate_registration(text, uuid);

CREATE OR REPLACE FUNCTION public.process_affiliate_registration(
  p_affiliate_code TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_affiliate_id UUID;
  v_current_registrations INTEGER;
  v_click_id UUID;
BEGIN
  -- Log da entrada
  RAISE NOTICE 'Iniciando process_affiliate_registration - Código: %, User ID: %', p_affiliate_code, p_user_id;
  
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
    RAISE NOTICE 'Afiliado não encontrado para código: %', p_affiliate_code;
    RETURN FALSE;
  END IF;
  
  RAISE NOTICE 'Afiliado encontrado - ID: %, Registros atuais: %', v_affiliate_id, v_current_registrations;
  
  -- Criar conversão
  INSERT INTO affiliate_conversions (
    affiliate_id, user_id, type, reference_id
  ) VALUES (
    v_affiliate_id, p_user_id, 'author_registration', p_user_id
  )
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Conversão criada para afiliado: %', v_affiliate_id;
  
  -- Incrementar total
  UPDATE affiliates
  SET total_registrations = COALESCE(total_registrations, 0) + 1,
      updated_at = NOW()
  WHERE id = v_affiliate_id;
  
  RAISE NOTICE 'Total de registros atualizado para afiliado: %', v_affiliate_id;
  
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
    
    RAISE NOTICE 'Clique % marcado como convertido', v_click_id;
  ELSE
    RAISE NOTICE 'Nenhum clique não convertido encontrado';
  END IF;
  
  -- Atualizar perfil do usuário
  UPDATE profiles
  SET moderator_notes = COALESCE(moderator_notes, '') || E'\nIndicado por: ' || p_affiliate_code
  WHERE id = p_user_id;
  
  RAISE NOTICE 'Perfil do usuário atualizado com nota de indicação';
  
  RAISE NOTICE 'Conversão processada com sucesso para afiliado: %', v_affiliate_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao processar conversão: %', SQLERRM;
    RETURN FALSE;
END;
$$;