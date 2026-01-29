import { supabase } from '@/integrations/supabase/client';

console.log('[Analytics Service] Modulo carregado - versao 2026.01.29');

// Gerar ou recuperar session ID com fallback para sessionStorage bloqueado
const getSessionId = (): string => {
  try {
    let sessionId = sessionStorage.getItem('offer_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('offer_session_id', sessionId);
    }
    return sessionId;
  } catch (e) {
    console.warn('[Analytics] sessionStorage bloqueado, usando ID temporario');
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

// Registrar evento de analytics
export const trackOfferEvent = async (
  eventType: 'page_view' | 'video_play' | 'video_progress' | 'video_complete' | 'button_click',
  eventData: Record<string, any> = {}
) => {
  const sessionId = getSessionId();
  console.log('[Analytics] Enviando evento:', eventType, 'Session:', sessionId);
  
  try {
    const { data, error } = await supabase
      .from('offer_page_analytics')
      .insert({
        event_type: eventType,
        event_data: eventData,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null
      })
      .select();

    if (error) {
      console.error('[Analytics] Erro ao registrar evento:', error.message, error.details, error.hint);
    } else {
      console.log('[Analytics] Evento registrado com sucesso:', eventType, data);
    }
  } catch (error) {
    console.error('[Analytics] Exceção ao registrar evento:', error);
  }
};

// Funções específicas para cada tipo de evento
export const trackPageView = () => trackOfferEvent('page_view');

export const trackVideoPlay = () => trackOfferEvent('video_play');

export const trackVideoProgress = (watchTime: number, percentComplete: number) => 
  trackOfferEvent('video_progress', { watchTime, percentComplete });

export const trackVideoComplete = () => trackOfferEvent('video_complete');

export const trackButtonClick = (buttonName: 'whatsapp' | 'register') => 
  trackOfferEvent('button_click', { button: buttonName });

// Buscar estatísticas (para admin)
export const getOfferPageStats = async (startDate?: Date, endDate?: Date) => {
  try {
    const { data, error } = await supabase.rpc('get_offer_page_stats', {
      p_start_date: startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      p_end_date: endDate?.toISOString() || new Date().toISOString()
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return null;
  }
};
