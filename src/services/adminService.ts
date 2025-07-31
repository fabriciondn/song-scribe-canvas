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
    return {
      totalUsers: stats.total_users || 0,
      totalSongs: stats.total_songs || 0,
      totalDrafts: stats.total_drafts || 0,
      totalPartnerships: stats.total_partnerships || 0,
      totalRegisteredWorks: stats.total_registered_works || 0,
      activeUsers: stats.active_users || 0,
      totalTemplates: stats.total_templates || 0,
      totalFolders: stats.total_folders || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do admin:', error);
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

export const updateUserCredits = async (userId: string, credits: number) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ credits })
      .eq('id', userId);

    if (error) {
      throw new Error(`Erro ao atualizar créditos: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro ao atualizar créditos do usuário:', error);
    throw error;
  }
};