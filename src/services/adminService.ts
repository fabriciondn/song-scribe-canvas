import { supabase } from '@/integrations/supabase/client';

export interface AdminDashboardStats {
  totalUsers: number;
  totalSongs: number;
  totalDrafts: number;
  totalPartnerships: number;
  totalRegisteredWorks: number;
  activeUsers: number;
  totalTemplates: number;
  totalFolders: number;
  totalComposers: number;
  totalProtectedWorks: number;
  totalRevenue: number;
  proUsers: number;
  trialUsers: number;
  freeUsers: number;
  inactiveUsers: number;
}

export interface RevenueTransaction {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  total_amount: number;
  credits_purchased?: number;
  bonus_credits?: number;
  payment_id: string;
  completed_at: string;
  transaction_type: 'credits' | 'subscription';
  subscription_plan?: string;
}

export interface UserByPlan {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  subscription_status: string;
  expires_at?: string;
  last_activity?: string;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  artistic_name: string;
  created_at: string;
  credits: number;
}

export interface RecentActivity {
  type: string;
  description: string;
  user_name: string;
  created_at: string;
}

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  try {
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
    
    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const stats = data as any;
    
    // Calcular faturamento de créditos via Mercado Pago
    const { data: creditTransactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('total_amount')
      .eq('status', 'completed')
      .eq('payment_provider', 'mercadopago');
    
    if (transError) {
      console.error('Erro ao buscar transações:', transError);
    }
    
    const creditRevenue = creditTransactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
    
    // Calcular faturamento de assinaturas via Mercado Pago
    const { data: paidSubscriptions, error: paidSubsError } = await supabase
      .from('subscriptions')
      .select('amount, started_at')
      .eq('payment_provider', 'mercadopago')
      .in('status', ['active', 'expired'])
      .not('started_at', 'is', null);
    
    if (paidSubsError) {
      console.error('Erro ao buscar assinaturas:', paidSubsError);
    }
    
    const subscriptionRevenue = paidSubscriptions?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0;
    
    const totalRevenue = creditRevenue + subscriptionRevenue;
    
    // Buscar contagem de usuários por tipo de assinatura
    const { data: allSubscriptions, error: allSubsError } = await supabase
      .from('subscriptions')
      .select('user_id, status, expires_at')
      .order('created_at', { ascending: false });
    
    if (allSubsError) {
      console.error('Erro ao buscar assinaturas:', allSubsError);
    }

    // Contar usuários únicos por status
    const usersByStatus = new Map<string, Set<string>>();
    allSubscriptions?.forEach(sub => {
      const isExpired = sub.expires_at && new Date(sub.expires_at) < new Date();
      const status = isExpired ? 'free' : sub.status;
      
      if (!usersByStatus.has(status)) {
        usersByStatus.set(status, new Set());
      }
      usersByStatus.get(status)?.add(sub.user_id);
    });

    const proUsers = usersByStatus.get('active')?.size || 0;
    const trialUsers = usersByStatus.get('trial')?.size || 0;
    const freeUsers = (usersByStatus.get('free')?.size || 0) + (usersByStatus.get('expired')?.size || 0);

    // Buscar usuários inativos (sem atividade nos últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: inactiveUsersData, error: inactiveError } = await supabase
      .from('user_sessions')
      .select('user_id')
      .lt('last_activity', thirtyDaysAgo.toISOString());
    
    if (inactiveError) {
      console.error('Erro ao buscar usuários inativos:', inactiveError);
    }

    const inactiveUsers = new Set(inactiveUsersData?.map(u => u.user_id) || []).size;
    
    return {
      totalUsers: stats.total_users || 0,
      totalSongs: stats.total_songs || 0,
      totalDrafts: stats.total_drafts || 0,
      totalPartnerships: stats.total_partnerships || 0,
      totalRegisteredWorks: stats.total_registered_works || 0,
      activeUsers: stats.active_users || 0,
      totalTemplates: stats.total_templates || 0,
      totalFolders: stats.total_folders || 0,
      totalComposers: stats.total_users || 0,
      totalProtectedWorks: stats.total_registered_works || 0,
      totalRevenue: totalRevenue,
      proUsers,
      trialUsers,
      freeUsers,
      inactiveUsers,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do admin:', error);
    throw error;
  }
};

export const getRevenueTransactions = async (): Promise<RevenueTransaction[]> => {
  try {
    // Buscar transações de créditos
    const { data: creditTransactions, error: creditsError } = await supabase
      .from('credit_transactions')
      .select(`
        id,
        user_id,
        total_amount,
        credits_purchased,
        bonus_credits,
        payment_id,
        completed_at
      `)
      .eq('status', 'completed')
      .eq('payment_provider', 'mercadopago')
      .order('completed_at', { ascending: false });

    if (creditsError) throw creditsError;

    // Buscar assinaturas pagas via Mercado Pago
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        amount,
        plan_type,
        payment_provider_subscription_id,
        started_at
      `)
      .eq('payment_provider', 'mercadopago')
      .in('status', ['active', 'expired'])
      .not('started_at', 'is', null)
      .order('started_at', { ascending: false });

    if (subsError) throw subsError;

    // Coletar todos os user_ids
    const creditUserIds = creditTransactions?.map(t => t.user_id) || [];
    const subsUserIds = subscriptions?.map(s => s.user_id) || [];
    const allUserIds = [...new Set([...creditUserIds, ...subsUserIds])];

    if (allUserIds.length === 0) {
      return [];
    }

    // Buscar perfis dos usuários
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .in('id', allUserIds);

    if (profilesError) {
      console.error('Erro ao buscar perfis:', profilesError);
    }

    // Mapear perfis por ID
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Mapear transações de créditos
    const creditTransactionsData: RevenueTransaction[] = (creditTransactions || []).map(t => {
      const profile = profilesMap.get(t.user_id);
      return {
        id: t.id,
        user_id: t.user_id,
        user_name: profile?.name || 'Usuário Desconhecido',
        user_email: profile?.email || '',
        user_avatar: profile?.avatar_url || null,
        total_amount: Number(t.total_amount) || 0,
        credits_purchased: Number(t.credits_purchased) || 0,
        bonus_credits: Number(t.bonus_credits) || 0,
        payment_id: t.payment_id || '',
        completed_at: t.completed_at || '',
        transaction_type: 'credits' as const,
      };
    });

    // Mapear transações de assinaturas
    const subscriptionTransactionsData: RevenueTransaction[] = (subscriptions || []).map(s => {
      const profile = profilesMap.get(s.user_id);
      return {
        id: s.id,
        user_id: s.user_id,
        user_name: profile?.name || 'Usuário Desconhecido',
        user_email: profile?.email || '',
        user_avatar: profile?.avatar_url || null,
        total_amount: s.amount || 0,
        payment_id: s.payment_provider_subscription_id || '',
        completed_at: s.started_at || '',
        transaction_type: 'subscription' as const,
        subscription_plan: s.plan_type || 'pro',
      };
    });

    // Combinar e ordenar por data
    const allTransactions = [...creditTransactionsData, ...subscriptionTransactionsData];
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.completed_at).getTime();
      const dateB = new Date(b.completed_at).getTime();
      return dateB - dateA;
    });

    return allTransactions;
  } catch (error) {
    console.error('Erro ao buscar transações de receita:', error);
    throw error;
  }
};

export const getUsersByPlan = async (planType: 'pro' | 'trial' | 'free' | 'inactive'): Promise<UserByPlan[]> => {
  try {
    if (planType === 'inactive') {
      // Buscar usuários inativos (sem atividade nos últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: inactiveSessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('user_id, last_activity')
        .lt('last_activity', thirtyDaysAgo.toISOString());
      
      if (sessionsError) throw sessionsError;

      const userIds = inactiveSessions?.map(s => s.user_id) || [];
      
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, created_at')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;

      // Mapear última atividade
      const lastActivityMap = new Map(inactiveSessions?.map(s => [s.user_id, s.last_activity]) || []);

      return (profiles || []).map(p => ({
        id: p.id,
        name: p.name || 'Sem nome',
        email: p.email || '',
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        subscription_status: 'inactive',
        last_activity: lastActivityMap.get(p.id),
      }));
    }

    // Buscar assinaturas por tipo
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('user_id, status, expires_at, created_at')
      .order('created_at', { ascending: false });
    
    if (subsError) throw subsError;

    // Filtrar por tipo de plano
    const filteredSubs = subscriptions?.filter(sub => {
      const isExpired = sub.expires_at && new Date(sub.expires_at) < new Date();
      
      if (planType === 'pro') {
        return sub.status === 'active' && !isExpired;
      } else if (planType === 'trial') {
        return sub.status === 'trial' && !isExpired;
      } else if (planType === 'free') {
        return isExpired || sub.status === 'expired' || sub.status === 'free';
      }
      return false;
    }) || [];

    // Remover duplicatas (pegar apenas a assinatura mais recente de cada usuário)
    const uniqueUserIds = [...new Set(filteredSubs.map(s => s.user_id))];

    if (uniqueUserIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, created_at')
      .in('id', uniqueUserIds);
    
    if (profilesError) throw profilesError;

    // Mapear dados de assinatura
    const subsMap = new Map(filteredSubs.map(s => [s.user_id, s]));

    return (profiles || []).map(p => {
      const sub = subsMap.get(p.id);
      return {
        id: p.id,
        name: p.name || 'Sem nome',
        email: p.email || '',
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        subscription_status: sub?.status || planType,
        expires_at: sub?.expires_at,
      };
    });
  } catch (error) {
    console.error('Erro ao buscar usuários por plano:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, artistic_name, created_at, credits')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw error;
  }
};

export const getRecentActivity = async (): Promise<RecentActivity[]> => {
  try {
    // Buscar atividades recentes de diferentes tabelas
    const [songsData, draftsData, partnershipsData] = await Promise.all([
      supabase
        .from('songs')
        .select('created_at, title, user_id')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('drafts')
        .select('created_at, title, user_id')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('partnerships')
        .select('created_at, title, user_id')
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    const activities: RecentActivity[] = [];

    // Adicionar músicas
    songsData.data?.forEach(song => {
      activities.push({
        type: 'song',
        description: `Nova música criada: ${song.title}`,
        user_name: 'Usuário',
        created_at: song.created_at
      });
    });

    // Adicionar rascunhos
    draftsData.data?.forEach(draft => {
      activities.push({
        type: 'draft',
        description: `Novo rascunho criado: ${draft.title}`,
        user_name: 'Usuário',
        created_at: draft.created_at
      });
    });

    // Adicionar parcerias
    partnershipsData.data?.forEach(partnership => {
      activities.push({
        type: 'partnership',
        description: `Nova parceria criada: ${partnership.title}`,
        user_name: 'Usuário',
        created_at: partnership.created_at
      });
    });

    // Ordenar por data mais recente
    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);

  } catch (error) {
    console.error('Erro ao buscar atividades recentes:', error);
    throw error;
  }
};

export const getOnlineUsersCount = async (): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('get_online_users_count');
    
    if (error) {
      console.error('Erro ao buscar usuários online:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Erro ao buscar usuários online:', error);
    return 0;
  }
};

export const updateUserCredits = async (userId: string, credits: number) => {
  try {
    const { error } = await supabase.rpc('admin_update_user_credits', {
      target_user_id: userId,
      new_credits: credits
    });

    if (error) {
      throw new Error(`Erro ao atualizar créditos: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro ao atualizar créditos do usuário:', error);
    throw error;
  }
};