-- 1. Desativar o trigger que muda status imediatamente
DROP TRIGGER IF EXISTS complete_author_registration_analysis ON public.author_registrations;

-- 2. Atualizar a função process_pending_registrations para usar 2-5 minutos
CREATE OR REPLACE FUNCTION public.process_pending_registrations()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update registrations que estão em análise há pelo menos 2 minutos (mínimo)
  -- com tempo aleatório de até 5 minutos (máximo)
  UPDATE public.author_registrations 
  SET 
    status = 'registered',
    analysis_completed_at = NOW(),
    updated_at = NOW()
  WHERE status = 'em análise' 
    AND analysis_started_at IS NOT NULL
    AND analysis_started_at < NOW() - INTERVAL '2 minutes' - (INTERVAL '1 minute' * random() * 3);
    
  -- Update registrations que não têm analysis_started_at mas são antigas (fallback)
  -- Aguarda pelo menos 2 minutos antes de processar
  UPDATE public.author_registrations 
  SET 
    status = 'registered',
    analysis_started_at = NOW(),
    analysis_completed_at = NOW(),
    updated_at = NOW()
  WHERE status = 'em análise' 
    AND analysis_started_at IS NULL
    AND created_at < NOW() - INTERVAL '2 minutes';
END;
$function$;