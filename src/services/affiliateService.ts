import { supabase } from '@/integrations/supabase/client';

export interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  level: 'bronze' | 'silver' | 'gold';
  total_registrations: number;
  total_subscriptions: number;
  total_earnings: number;
  total_paid: number;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  user_id: string;
  type: 'author_registration' | 'subscription_recurring';
  reference_id: string;
  amount: number;
  commission_rate: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  campaign_id?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateCampaign {
  id: string;
  affiliate_id: string;
  name: string;
  description?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  total_clicks: number;
  total_conversions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AffiliateStats {
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  this_month_earnings: number;
  registrations_count: number;
  subscriptions_count: number;
}

// Aplicar para ser afiliado
export async function applyForAffiliate(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Usuário não autenticado');

    // Verificar se já é afiliado
    const { data: existing } = await supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', user.user.id)
      .single();

    if (existing) {
      return { success: false, error: 'Você já possui uma solicitação de afiliação' };
    }

    // Buscar dados do perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.user.id)
      .single();

    if (!profile?.name) {
      return { success: false, error: 'Complete seu perfil antes de se tornar afiliado' };
    }

    // Gerar código único
    const { data: code, error: codeError } = await supabase.rpc('generate_affiliate_code', {
      user_id: user.user.id,
      user_name: profile.name
    });

    if (codeError) throw codeError;

    // Criar solicitação de afiliação
    const { error } = await supabase
      .from('affiliates')
      .insert({
        user_id: user.user.id,
        affiliate_code: code
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao aplicar para afiliado:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

// Buscar dados do afiliado atual
export async function getMyAffiliateData(): Promise<Affiliate | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados do afiliado:', error);
    return null;
  }
}

// Buscar estatísticas do afiliado
export async function getAffiliateStats(): Promise<AffiliateStats | null> {
  try {
    const affiliate = await getMyAffiliateData();
    if (!affiliate) return null;

    // Buscar cliques totais
    const { count: total_clicks } = await supabase
      .from('affiliate_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_id', affiliate.id);

    // Buscar conversões totais
    const { count: total_conversions } = await supabase
      .from('affiliate_conversions')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_id', affiliate.id);

    // Buscar comissões pendentes
    const { data: pendingCommissions } = await supabase
      .from('affiliate_commissions')
      .select('amount')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'pending');

    const pending_earnings = pendingCommissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

    // Buscar comissões deste mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyCommissions } = await supabase
      .from('affiliate_commissions')
      .select('amount')
      .eq('affiliate_id', affiliate.id)
      .gte('created_at', startOfMonth.toISOString());

    const this_month_earnings = monthlyCommissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

    return {
      total_clicks: total_clicks || 0,
      total_conversions: total_conversions || 0,
      conversion_rate: total_clicks ? (total_conversions || 0) / total_clicks * 100 : 0,
      total_earnings: Number(affiliate.total_earnings),
      pending_earnings,
      paid_earnings: Number(affiliate.total_paid),
      this_month_earnings,
      registrations_count: affiliate.total_registrations,
      subscriptions_count: affiliate.total_subscriptions
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return null;
  }
}

// Buscar comissões do afiliado
export async function getAffiliateCommissions(): Promise<AffiliateCommission[]> {
  try {
    const affiliate = await getMyAffiliateData();
    if (!affiliate) return [];

    const { data, error } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar comissões:', error);
    return [];
  }
}

// Buscar campanhas do afiliado
export async function getAffiliateCampaigns(): Promise<AffiliateCampaign[]> {
  try {
    const affiliate = await getMyAffiliateData();
    if (!affiliate) return [];

    const { data, error } = await supabase
      .from('affiliate_campaigns')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar campanhas:', error);
    return [];
  }
}

// Criar nova campanha
export async function createAffiliateCampaign(campaignData: Omit<AffiliateCampaign, 'id' | 'affiliate_id' | 'total_clicks' | 'total_conversions' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> {
  try {
    const affiliate = await getMyAffiliateData();
    if (!affiliate) return { success: false, error: 'Dados do afiliado não encontrados' };

    const { error } = await supabase
      .from('affiliate_campaigns')
      .insert({
        affiliate_id: affiliate.id,
        ...campaignData
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar campanha:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

// Gerar link de afiliado
export function generateAffiliateLink(affiliateCode: string, campaign?: string): string {
  const baseUrl = window.location.origin;
  let url = `${baseUrl}/ref/${affiliateCode}`;
  
  if (campaign) {
    url += `?utm_campaign=${encodeURIComponent(campaign)}`;
  }
  
  return url;
}

// Registrar clique no link
export async function trackAffiliateClick(affiliateCode: string, utmParams?: Record<string, string>): Promise<void> {
  try {
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id')
      .eq('affiliate_code', affiliateCode)
      .eq('status', 'approved')
      .single();

    if (!affiliate) return;

    await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_id: affiliate.id,
        ip_address: '127.0.0.1', // Em produção, capturar IP real
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        utm_source: utmParams?.utm_source,
        utm_medium: utmParams?.utm_medium,
        utm_campaign: utmParams?.utm_campaign,
        utm_content: utmParams?.utm_content
      });

    // Salvar código no localStorage para conversão posterior
    localStorage.setItem('affiliate_code', affiliateCode);
  } catch (error) {
    console.error('Erro ao registrar clique:', error);
  }
}

// Processar conversão
export async function processAffiliateConversion(
  type: 'author_registration' | 'subscription_recurring',
  referenceId: string,
  amount: number
): Promise<void> {
  try {
    const affiliateCode = localStorage.getItem('affiliate_code');
    if (!affiliateCode) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    await supabase.rpc('process_affiliate_conversion', {
      p_affiliate_code: affiliateCode,
      p_user_id: user.user.id,
      p_type: type,
      p_reference_id: referenceId,
      p_amount: amount
    });

    // Remover código após conversão
    localStorage.removeItem('affiliate_code');
  } catch (error) {
    console.error('Erro ao processar conversão:', error);
  }
}