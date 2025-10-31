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
  custom_commission_rate?: number | null;
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

// Affiliate application and data retrieval
interface AffiliateApplicationData {
  fullName: string;
  whatsapp: string;
  email: string;
  socialMediaLink: string;
  youtubeLink: string;
  tiktokLink: string;
  websiteLink: string;
  promotionStrategy: string;
}

export async function applyForAffiliate(applicationData: AffiliateApplicationData): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 Iniciando aplicação para afiliado...');
    
    // Passo 1: Verificar autenticação
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Erro de autenticação:', authError);
      return { success: false, error: 'Erro de autenticação. Por favor, faça login novamente.' };
    }
    
    if (!user.user) {
      console.error('❌ Usuário não autenticado');
      return { success: false, error: 'Você precisa estar autenticado para se inscrever.' };
    }
    
    console.log('✅ Usuário autenticado:', user.user.id);

    // Passo 2: Verificar duplicação
    console.log('🔍 Verificando se usuário já é afiliado...');
    const { data: existing, error: checkError } = await supabase
      .from('affiliates')
      .select('id, status')
      .eq('user_id', user.user.id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Erro ao verificar afiliado existente:', checkError);
      return { success: false, error: 'Erro ao verificar dados. Tente novamente.' };
    }

    if (existing) {
      console.log('⚠️ Usuário já possui solicitação');
      return { success: false, error: 'Você já possui uma solicitação de afiliação' };
    }
    
    console.log('✅ Usuário não possui solicitação anterior');

    // Passo 3: Gerar código de afiliado
    console.log('🔍 Gerando código de afiliado...');
    const { data: code, error: codeError } = await supabase.rpc('generate_affiliate_code', {
      user_id: user.user.id,
      user_name: applicationData.fullName
    });

    console.log('📝 Retorno da função generate_affiliate_code:', { code, error: codeError });

    if (codeError) {
      console.error('❌ Erro ao gerar código:', codeError);
      return { success: false, error: `Erro ao gerar código de afiliado: ${codeError.message}` };
    }

    if (!code || typeof code !== 'string') {
      console.error('❌ Código inválido retornado:', code);
      return { success: false, error: 'Erro ao gerar código de afiliado. Por favor, tente novamente.' };
    }

    console.log('✅ Código gerado com sucesso:', code);

    // Passo 4: Inserir no banco
    console.log('🔍 Inserindo solicitação no banco...');
    const { error: insertError } = await supabase
      .from('affiliates')
      .insert({
        user_id: user.user.id,
        affiliate_code: code,
        status: 'pending',
        level: 'bronze',
        full_name: applicationData.fullName,
        whatsapp: applicationData.whatsapp,
        contact_email: applicationData.email,
        social_media_link: applicationData.socialMediaLink || null,
        youtube_link: applicationData.youtubeLink || null,
        tiktok_link: applicationData.tiktokLink || null,
        website_link: applicationData.websiteLink || null,
        promotion_strategy: applicationData.promotionStrategy
      });

    if (insertError) {
      console.error('❌ Erro ao inserir no banco:', insertError);
      return { success: false, error: `Erro ao salvar solicitação: ${insertError.message}` };
    }

    console.log('✅ Solicitação criada com sucesso!');
    return { success: true };
    
  } catch (error: any) {
    console.error('❌ Erro inesperado ao aplicar para afiliado:', error);
    return { 
      success: false, 
      error: error?.message || 'Erro inesperado. Por favor, tente novamente ou entre em contato com o suporte.' 
    };
  }
}

// Buscar dados do afiliado atual
export async function getMyAffiliateData(): Promise<Affiliate | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    // Verificar se há impersonação ativa
    const impersonationData = localStorage.getItem('impersonation_data');
    let targetUserId = user.user.id;
    
    if (impersonationData) {
      try {
        const parsedData = JSON.parse(impersonationData);
        if (parsedData.targetUser?.id) {
          targetUserId = parsedData.targetUser.id;
          console.log('🎭 Buscando dados de afiliado para usuário impersonado:', targetUserId);
        }
      } catch (e) {
        console.error('Erro ao parsear dados de impersonação:', e);
      }
    }

    const { data, error } = await supabase
      .from('affiliates')
      .select('*, custom_commission_rate')
      .eq('user_id', targetUserId)
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

// DOMÍNIO DE PRODUÇÃO FIXO
const PRODUCTION_DOMAIN = 'https://compuse.com.br';

/**
 * Retorna a taxa de comissão efetiva do parceiro
 * Prioriza custom_commission_rate, senão usa taxa padrão do nível
 */
export function getEffectiveCommissionRate(affiliate: Affiliate): number {
  // Se tem taxa personalizada, usa ela
  if (affiliate.custom_commission_rate !== null && 
      affiliate.custom_commission_rate !== undefined) {
    return affiliate.custom_commission_rate;
  }
  
  // Senão usa taxa padrão baseada no nível
  const defaultRates = {
    bronze: 25,
    silver: 50,
    gold: 50
  };
  
  return defaultRates[affiliate.level] || 25;
}

/**
 * Gera um link de parceiro
 */
export function generateAffiliateLink(affiliateCode: string, campaign?: string): string {
  // Remove o prefixo "compuse-" para gerar link limpo
  const code = affiliateCode.replace(/^compuse-/, '');
  // Sempre usar domínio de produção
  let url = `${PRODUCTION_DOMAIN}/ref/${code}`;
  
  if (campaign) {
    url += `?utm_campaign=${encodeURIComponent(campaign)}`;
  }
  
  return url;
}

// Registrar clique no link
export async function trackAffiliateClick(affiliateCode: string, utmParams?: Record<string, string>): Promise<void> {
  try {
    console.log('🔍 Buscando afiliado com código:', affiliateCode);
    
    // Tentar diferentes formatos do código
    const possibleCodes = [
      affiliateCode,
      affiliateCode.startsWith('compuse-') ? affiliateCode : `compuse-${affiliateCode}`,
      affiliateCode.replace(/^compuse-/, '')
    ];
    
    let affiliate = null;
    let affiliateError = null;
    
    for (const code of possibleCodes) {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, affiliate_code')
        .eq('affiliate_code', code)
        .eq('status', 'approved')
        .maybeSingle();
      
      if (data) {
        affiliate = data;
        console.log('✅ Afiliado encontrado com código:', code);
        break;
      }
      
      affiliateError = error;
    }

    if (!affiliate) {
      console.error('❌ Afiliado não encontrado para código:', affiliateCode);
      return;
    }

    // Verificar se usuário está autenticado para marcar conversão automaticamente
    const { data: { user } } = await supabase.auth.getUser();
    const isAuthenticated = !!user;

    const { data: click, error: clickError } = await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_id: affiliate.id,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        utm_source: utmParams?.utm_source,
        utm_medium: utmParams?.utm_medium,
        utm_campaign: utmParams?.utm_campaign,
        utm_content: utmParams?.utm_content,
        converted: isAuthenticated // Marcar como convertido se já autenticado
      })
      .select()
      .single();

    console.log('📊 Clique registrado:', click, 'Autenticado:', isAuthenticated, 'Erro:', clickError);

    // Salvar código completo no localStorage para conversão posterior
    localStorage.setItem('affiliate_code', affiliate.affiliate_code);
    console.log('💾 Código salvo no localStorage:', affiliate.affiliate_code);
    
    // Se usuário já está autenticado, processar conversão imediatamente
    if (isAuthenticated && user) {
      console.log('✅ Usuário já autenticado, salvando código no perfil...');
      const normalizedCode = affiliate.affiliate_code.startsWith('compuse-') 
        ? affiliate.affiliate_code 
        : `compuse-${affiliate.affiliate_code}`;
      
      // Salvar nas notas do perfil
      await supabase
        .from('profiles')
        .update({ 
          moderator_notes: `Indicado por: ${normalizedCode}` 
        })
        .eq('id', user.id);
      
      console.log('💾 Código salvo no perfil do usuário autenticado');
    }
  } catch (error) {
    console.error('❌ Erro ao registrar clique:', error);
  }
}

// Processar conversão
// Valores atualizados da plataforma
const PLATFORM_PRICES = {
  AUTHOR_REGISTRATION: 19.99, // Novo preço do registro autoral
  SUBSCRIPTION_MONTHLY: 15.00, // Preço da assinatura mensal
  CREDIT_UNIT: 19.99 // Preço do crédito
};

// Taxas de comissão por nível
// Até 5 registros: 25% de R$ 19,99 = R$ 4,9975
// Após 5 registros: 50% de R$ 19,99 = R$ 9,995
const COMMISSION_RATES = {
  BRONZE_REGISTRATION_FIRST_5: 0.25, // 25% sobre registro até 5 (R$ 4,9975)
  SILVER_REGISTRATION_AFTER_5: 0.50, // 50% sobre registro após 5 (R$ 9,995)
  GOLD_SUBSCRIPTION_FIRST_10: 0.25, // 25% para primeiros 10 assinantes (R$ 3,75/mês)
  GOLD_SUBSCRIPTION_AFTER_10: 0.50 // 50% após 10 assinantes (R$ 7,50/mês)
};

export async function processAffiliateConversion(
  type: 'author_registration' | 'subscription_recurring',
  referenceId: string,
  amount: number
): Promise<void> {
  try {
    const affiliateCode = localStorage.getItem('affiliate_code');
    
    console.log('🔍 Processando conversão de afiliado:', {
      affiliateCode: affiliateCode ? '✅ Encontrado' : '❌ Não encontrado',
      type,
      referenceId,
      amount
    });
    
    if (!affiliateCode) {
      console.log('⚠️ Nenhum código de afiliado encontrado no localStorage');
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    console.log('📡 Chamando RPC process_affiliate_conversion...', {
      p_affiliate_code: affiliateCode,
      p_user_id: user.user.id,
      p_type: type,
      p_reference_id: referenceId,
      p_amount: amount
    });

    const { data, error } = await supabase.rpc('process_affiliate_conversion', {
      p_affiliate_code: affiliateCode,
      p_user_id: user.user.id,
      p_type: type,
      p_reference_id: referenceId,
      p_amount: amount
    });

    if (error) {
      console.error('❌ Erro ao processar conversão:', error);
      throw error;
    }

    console.log('✅ Conversão processada com sucesso:', data);

    // Remover código após conversão bem-sucedida
    localStorage.removeItem('affiliate_code');
    console.log('🧹 Código de afiliado removido do localStorage');
  } catch (error) {
    console.error('❌ Erro ao processar conversão:', error);
    // Não lançar erro para não bloquear o fluxo principal
  }
}