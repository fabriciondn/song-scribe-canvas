-- Criar tabela para analytics da página de ofertas
CREATE TABLE public.offer_page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'page_view', 'video_play', 'video_progress', 'button_click', 'video_complete'
  event_data JSONB DEFAULT '{}',
  session_id TEXT NOT NULL,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX idx_offer_analytics_event_type ON public.offer_page_analytics(event_type);
CREATE INDEX idx_offer_analytics_created_at ON public.offer_page_analytics(created_at);
CREATE INDEX idx_offer_analytics_session_id ON public.offer_page_analytics(session_id);

-- RLS - permitir inserção pública (para tracking) mas leitura apenas para admins
ALTER TABLE public.offer_page_analytics ENABLE ROW LEVEL SECURITY;

-- Política para inserção pública (anônimos podem registrar eventos)
CREATE POLICY "Anyone can insert analytics events"
ON public.offer_page_analytics
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política para leitura apenas por admins
CREATE POLICY "Only admins can read analytics"
ON public.offer_page_analytics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Função para obter estatísticas da página de ofertas
CREATE OR REPLACE FUNCTION public.get_offer_page_stats(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- Tempo médio de visualização (em segundos)
  SELECT COALESCE(AVG((event_data->>'watchTime')::NUMERIC), 0) INTO avg_watch_time
  FROM public.offer_page_analytics
  WHERE event_type = 'video_progress'
    AND created_at BETWEEN p_start_date AND p_end_date;

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

  -- Dados por hora (últimas 24h para gráfico de horários de pico)
  SELECT COALESCE(jsonb_agg(hourly_stats ORDER BY hour), '[]'::jsonb) INTO hourly_data
  FROM (
    SELECT 
      EXTRACT(HOUR FROM created_at) as hour,
      COUNT(*) as views
    FROM public.offer_page_analytics
    WHERE event_type = 'page_view'
      AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY EXTRACT(HOUR FROM created_at)
  ) hourly_stats;

  result := jsonb_build_object(
    'total_views', total_views,
    'unique_sessions', unique_sessions,
    'total_video_plays', total_video_plays,
    'total_video_completes', total_video_completes,
    'avg_watch_time_seconds', ROUND(avg_watch_time, 2),
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