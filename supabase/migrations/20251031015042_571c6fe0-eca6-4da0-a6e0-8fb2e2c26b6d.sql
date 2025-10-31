-- ============================================
-- MIGRATION: Correção do Sistema de Afiliados
-- ============================================
-- Esta migration corrige dados históricos de afiliados
-- e garante que o sistema funcione corretamente daqui em diante

-- ETAPA 1: Adicionar código de parceiro nas notas dos usuários que foram convertidos mas não têm o código
DO $$
DECLARE
  conversion_record RECORD;
  affiliate_record RECORD;
  normalized_code TEXT;
BEGIN
  RAISE NOTICE 'Iniciando correção de dados históricos de afiliados...';
  
  FOR conversion_record IN 
    SELECT 
      ac.user_id,
      ac.affiliate_id,
      ac.created_at
    FROM affiliate_conversions ac
    JOIN profiles p ON p.id = ac.user_id
    WHERE p.moderator_notes IS NULL 
       OR p.moderator_notes NOT LIKE '%Indicado por:%'
    ORDER BY ac.created_at
  LOOP
    SELECT affiliate_code INTO affiliate_record
    FROM affiliates
    WHERE id = conversion_record.affiliate_id;
    
    IF FOUND THEN
      normalized_code := CASE 
        WHEN affiliate_record.affiliate_code LIKE 'compuse-%' 
        THEN affiliate_record.affiliate_code
        ELSE 'compuse-' || affiliate_record.affiliate_code
      END;
      
      UPDATE profiles
      SET moderator_notes = COALESCE(moderator_notes || E'\n', '') || 'Indicado por: ' || normalized_code
      WHERE id = conversion_record.user_id;
      
      RAISE NOTICE 'Código % adicionado ao perfil do usuário %', normalized_code, conversion_record.user_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Correção de perfis concluída!';
END $$;

-- ETAPA 2: Verificar e criar comissões faltantes
DO $$
DECLARE
  user_record RECORD;
  affiliate_id_var UUID;
  affiliate_code_var TEXT;
  custom_rate NUMERIC;
  commission_rate NUMERIC;
  commission_amount NUMERIC;
  payment_amount NUMERIC := 19.99;
  existing_commission UUID;
  total_regs INTEGER;
BEGIN
  RAISE NOTICE 'Verificando comissões faltantes...';
  
  FOR user_record IN
    SELECT DISTINCT
      ar.user_id,
      ar.id as registration_id,
      p.moderator_notes,
      ar.created_at
    FROM author_registrations ar
    JOIN profiles p ON p.id = ar.user_id
    WHERE p.moderator_notes LIKE '%Indicado por:%'
      AND ar.status IN ('registered', 'completed')
    ORDER BY ar.created_at
  LOOP
    affiliate_code_var := regexp_replace(
      user_record.moderator_notes, 
      '.*Indicado por:\s*([^\n]+).*', 
      '\1'
    );
    affiliate_code_var := TRIM(affiliate_code_var);
    
    SELECT id, custom_commission_rate 
    INTO affiliate_id_var, custom_rate
    FROM affiliates
    WHERE (
      affiliate_code = affiliate_code_var
      OR affiliate_code = 'compuse-' || affiliate_code_var
      OR affiliate_code = regexp_replace(affiliate_code_var, '^compuse-', '')
    )
    AND status = 'approved'
    LIMIT 1;
    
    IF FOUND THEN
      SELECT id INTO existing_commission
      FROM affiliate_commissions
      WHERE affiliate_id = affiliate_id_var
        AND user_id = user_record.user_id
        AND type = 'author_registration'
      LIMIT 1;
      
      IF NOT FOUND THEN
        IF custom_rate IS NOT NULL THEN
          commission_rate := custom_rate;
        ELSE
          SELECT total_registrations INTO total_regs
          FROM affiliates
          WHERE id = affiliate_id_var;
          
          IF total_regs < 5 THEN
            commission_rate := 25.0;
          ELSE
            commission_rate := 50.0;
          END IF;
        END IF;
        
        commission_amount := ROUND(payment_amount * (commission_rate / 100), 2);
        
        INSERT INTO affiliate_commissions (
          affiliate_id,
          user_id,
          type,
          reference_id,
          amount,
          commission_rate,
          status
        ) VALUES (
          affiliate_id_var,
          user_record.user_id,
          'author_registration',
          user_record.registration_id,
          commission_amount,
          commission_rate,
          'pending'
        );
        
        UPDATE affiliates
        SET 
          total_earnings = total_earnings + commission_amount,
          updated_at = NOW()
        WHERE id = affiliate_id_var;
        
        RAISE NOTICE 'Comissão de R$ % criada para afiliado %', commission_amount, affiliate_id_var;
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Verificação de comissões concluída!';
END $$;

-- ETAPA 3: Atualizar contadores de registros dos afiliados
DO $$
BEGIN
  UPDATE affiliates a
  SET total_registrations = (
    SELECT COUNT(DISTINCT ac.user_id)
    FROM affiliate_conversions ac
    WHERE ac.affiliate_id = a.id
      AND ac.type = 'author_registration'
  ),
  updated_at = NOW()
  WHERE id IN (
    SELECT DISTINCT affiliate_id 
    FROM affiliate_conversions
  );
  
  RAISE NOTICE 'Contadores de afiliados atualizados!';
END $$;

-- ETAPA 4: Marcar cliques como convertidos
DO $$
BEGIN
  UPDATE affiliate_clicks
  SET converted = TRUE
  WHERE id IN (
    SELECT DISTINCT ac.id
    FROM affiliate_clicks ac
    JOIN affiliate_conversions conv ON conv.affiliate_id = ac.affiliate_id
    WHERE ac.converted = FALSE
      AND ac.created_at <= conv.created_at
  );
  
  RAISE NOTICE 'Sistema de afiliados corrigido com sucesso!';
END $$;