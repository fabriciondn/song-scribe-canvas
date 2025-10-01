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
  credits_purchased: number;
  bonus_credits: number;
  payment_id: string;
  completed_at: string;
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
    
    // Calcular faturamento apenas com transações completadas via Mercado Pago
    const { data: transactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('total_amount')
      .eq('status', 'completed')
      .eq('payment_provider', 'mercadopago');
    
    if (transError) {
      console.error('Erro ao buscar transações:', transError);
    }
    
    const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
    
    // Buscar contagem de usuários por tipo de assinatura
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('user_id, status, expires_at')
      .order('created_at', { ascending: false });
    
    if (subsError) {
      console.error('Erro ao buscar assinaturas:', subsError);
    }

    // Contar usuários únicos por status
    const usersByStatus = new Map<string, Set<string>>();
    subscriptions?.forEach(sub => {
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
    const { data: transactions, error } = await supabase
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

    if (error) throw error;

    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Buscar perfis dos usuários
    const userIds = transactions.map(t => t.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('Erro ao buscar perfis:', profilesError);
    }

    // Mapear perfis por ID
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return transactions.map(t => {
      const profile = profilesMap.get(t.user_id);
      return {
        id: t.id,
        user_id: t.user_id,
        user_name: profile?.name || 'Usuário Desconhecido',
        user_email: profile?.email || '',
        user_avatar: profile?.avatar_url || null,
        total_amount: t.total_amount,
        credits_purchased: t.credits_purchased,
        bonus_credits: t.bonus_credits || 0,
        payment_id: t.payment_id || '',
        completed_at: t.completed_at || '',
      };
    });
  } catch (error) {
    console.error('Erro ao buscar transações de receita:', error);
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