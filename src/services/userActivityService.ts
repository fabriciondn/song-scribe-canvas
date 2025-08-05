import { supabase } from '@/integrations/supabase/client';

export const logUserActivity = async (action: string, metadata: any = {}) => {
  // Desabilitado temporariamente para evitar lentidão
  // A função RPC está com problema no ON CONFLICT
  try {
    console.log(`🔍 Atividade registrada: ${action}`, metadata);
    // TODO: Reativar quando problema de database for corrigido
    // const { error } = await supabase.rpc('log_user_activity', {
    //   p_action: action,
    //   p_metadata: metadata
    // });
    // if (error) {
    //   console.error('Erro ao registrar atividade:', error);
    // }
  } catch (error) {
    console.log('Log de atividade ignorado:', error);
  }
};

export const trackPageView = (page: string) => {
  logUserActivity('page_view', { page });
};

export const trackUserLogin = () => {
  logUserActivity('user_login');
};

export const trackUserLogout = () => {
  logUserActivity('user_logout');
};

export const trackCreditUpdate = (oldCredits: number, newCredits: number) => {
  logUserActivity('credits_updated', { oldCredits, newCredits });
};