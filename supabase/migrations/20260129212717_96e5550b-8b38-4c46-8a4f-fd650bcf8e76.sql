-- Remover função antiga e criar nova corrigida
DROP FUNCTION IF EXISTS public.get_offer_page_stats(timestamp with time zone, timestamp with time zone);

-- Criar função corrigida com métricas precisas
CREATE OR REPLACE FUNCTION public.get_offer_page_stats(p_start_date TIMESTAMP WITH TIME ZONE, p_end_date TIMESTAMP WITH TIME ZONE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  total_views INTEGER;
  unique_sessions INTEGER;
  total_video_plays INTEGER;
  total_video_completes INTEGER;
  avg_watch_time NUMERIC;
  whatsapp_clicks INTEGER;
  register_clicks INTEGER;
  hourly_data JSONB;
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Total de visualizações
  SELECT COUNT(*) INTO total_views
  FROM public.offer_page_analytics
  WHERE event_type = 'page_view'
    AND created_at BETWEEN p_start_date AND p_end_date;

  -- Sessões únicas
  SELECT COUNT(DISTINCT session_id) INTO unique_sessions
  FROM public.offer_page_analytics
  WHERE created_at BETWEEN p_start_date AND p_end_date;

  -- Reproduções de vídeo
  SELECT COUNT(*) INTO total_video_plays
  FROM public.offer_page_analytics
  WHERE event_type = 'video_play'
    AND created_at BETWEEN p_start_date AND p_end_date;

  -- Vídeos completados
  SELECT COUNT(*) INTO total_video_completes
  FROM public.offer_page_analytics
  WHERE event_type = 'video_complete'
    AND created_at BETWEEN p_start_date AND p_end_date;

  -- Tempo médio de visualização: usa o MAX por sessão (valor mais alto = tempo real assistido)
  SELECT COALESCE(AVG(max_time), 0) INTO avg_watch_time
  FROM (
    SELECT session_id, MAX((event_data->>'watchTime')::NUMERIC) as max_time
    FROM public.offer_page_analytics
    WHERE event_type = 'video_progress'
      AND created_at BETWEEN p_start_date AND p_end_date
      AND event_data->>'watchTime' IS NOT NULL
    GROUP BY session_id
  ) session_times;

  -- Cliques no WhatsApp
  SELECT COUNT(*) INTO whatsapp_clicks
  FROM public.offer_page_analytics
  WHERE event_type = 'button_click'
    AND event_data->>'button' = 'whatsapp'
    AND created_at BETWEEN p_start_date AND p_end_date;

  -- Cliques no Registrar
  SELECT COUNT(*) INTO register_clicks
  FROM public.offer_page_analytics
  WHERE event_type = 'button_click'
    AND event_data->>'button' = 'register'
    AND created_at BETWEEN p_start_date AND p_end_date;

  -- Dados por hora (usa o período selecionado)
  SELECT COALESCE(jsonb_agg(hourly_stats ORDER BY hour), '[]'::jsonb) INTO hourly_data
  FROM (
    SELECT 
      EXTRACT(HOUR FROM created_at)::INTEGER as hour,
      COUNT(*)::INTEGER as views
    FROM public.offer_page_analytics
    WHERE event_type = 'page_view'
      AND created_at BETWEEN p_start_date AND p_end_date
    GROUP BY EXTRACT(HOUR FROM created_at)
  ) hourly_stats;

  result := jsonb_build_object(
    'total_views', total_views,
    'unique_sessions', unique_sessions,
    'total_video_plays', total_video_plays,
    'total_video_completes', total_video_completes,
    'avg_watch_time_seconds', ROUND(COALESCE(avg_watch_time, 0), 2),
    'video_completion_rate', CASE WHEN total_video_plays > 0 THEN ROUND((total_video_completes::NUMERIC / total_video_plays) * 100, 2) ELSE 0 END,
    'whatsapp_clicks', whatsapp_clicks,
    'register_clicks', register_clicks,
    'hourly_data', hourly_data,
    'period_start', p_start_date,
    'period_end', p_end_date
  );

  RETURN result;
END;
$$;