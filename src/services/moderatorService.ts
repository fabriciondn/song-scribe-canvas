
import { supabase } from '@/integrations/supabase/client';

export interface ModeratorDashboardStats {
  total_managed_users: number;
  total_managed_songs: number;
  total_managed_drafts: number;
  total_managed_registered_works: number;
  total_credits_distributed: number;
}

export interface ManagedUserData {
  id: string;
  name: string | null;
  email: string | null;
  artistic_name: string | null;
  credits: number;
  created_at: string;
}

// Buscar estatísticas do dashboard do moderador
export const getModeratorDashboardStats = async (): Promise<ModeratorDashboardStats> => {
  try {
    console.log('📊 Fetching moderator dashboard stats...');
    
    const { data, error } = await supabase.rpc('get_moderator_dashboard_stats');
    
    if (error) {
      console.error('❌ Error fetching moderator dashboard stats:', error);
      
      // Return default stats instead of throwing
      return {
        total_managed_users: 0,
        total_managed_songs: 0,
        total_managed_drafts: 0,
        total_managed_registered_works: 0,
        total_credits_distributed: 0
      };
    }
    
    console.log('✅ Moderator dashboard stats fetched:', data);
    
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return data as unknown as ModeratorDashboardStats;
    }
    
    // Return default if data is not in expected format
    return {
      total_managed_users: 0,
      total_managed_songs: 0,
      total_managed_drafts: 0,
      total_managed_registered_works: 0,
      total_credits_distributed: 0
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching moderator dashboard stats:', error);
    
    // Return default stats on any error
    return {
      total_managed_users: 0,
      total_managed_songs: 0,
      total_managed_drafts: 0,
      total_managed_registered_works: 0,
      total_credits_distributed: 0
    };
  }
};

// Buscar usuários gerenciados pelo moderador (filtrar usuários excluídos)
export const getManagedUsers = async (): Promise<ManagedUserData[]> => {
  try {
    console.log('👥 Fetching managed users...');
    
    // Obter o ID do usuário autenticado
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !currentUser) {
      console.error('❌ Error getting authenticated user:', authError);
      return [];
    }
    
    console.log('🔑 Authenticated moderator ID:', currentUser.id);
    
    // Fazemos duas consultas separadas para evitar problemas de join
    // CRÍTICO: Filtrar apenas pelos usuários deste moderador específico
    const { data: moderatorUsers, error: moderatorError } = await supabase
      .from('moderator_users')
      .select('user_id, created_at')
      .eq('moderator_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (moderatorError) {
      console.error('❌ Error fetching moderator users:', moderatorError);
      return []; // Return empty array instead of throwing
    }

    if (!moderatorUsers || moderatorUsers.length === 0) {
      console.log('📭 No managed users found');
      return [];
    }

    console.log('✅ Found moderator users:', moderatorUsers.length);

    const userIds = moderatorUsers.map(mu => mu.user_id);
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, artistic_name, credits')
      .in('id', userIds)
      // Filtrar usuários que não foram excluídos (nome não contém "[USUÁRIO EXCLUÍDO]")
      .not('name', 'like', '%[USUÁRIO EXCLUÍDO]%');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      // Return users with basic data even if profiles fail
      return moderatorUsers.map(mu => ({
        id: mu.user_id,
        name: null,
        email: null,
        artistic_name: null,
        credits: 0,
        created_at: mu.created_at
      }));
    }

    console.log('✅ Found profiles:', profiles?.length || 0);

    // Combinar os dados apenas para usuários que ainda existem no profiles
    const combinedData = moderatorUsers
      .filter(mu => profiles?.some(p => p.id === mu.user_id))
      .map(mu => {
        const profile = profiles.find(p => p.id === mu.user_id);
        return {
          id: mu.user_id,
          name: profile?.name || null,
          email: profile?.email || null,
          artistic_name: profile?.artistic_name || null,
          credits: profile?.credits || 0,
          created_at: mu.created_at
        };
      });
    
    console.log('✅ Combined managed users data (filtered):', combinedData.length);
    return combinedData;
    
  } catch (error) {
    console.error('❌ Unexpected error fetching managed users:', error);
    return []; // Return empty array on any error
  }
};

// Atualizar créditos de usuário gerenciado
export const updateManagedUserCredits = async (userId: string, credits: number): Promise<void> => {
  const { error } = await supabase.rpc('moderator_update_user_credits', {
    target_user_id: userId,
    new_credits: credits
  });

  if (error) {
    console.error('Error updating user credits:', error);
    throw new Error(error.message || 'Erro ao atualizar créditos do usuário');
  }
};

// Criar novo usuário (função para moderadores)
export const createUserForModerator = async (userData: {
  name: string;
  email: string;
  password: string;
  artistic_name?: string;
}): Promise<{ userId: string }> => {
  console.log('🔧 Criando usuário via edge function:', userData.email);
  
  // Obter o token de acesso da sessão atual
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.access_token) {
    console.error('❌ Erro ao obter sessão:', sessionError);
    throw new Error('Erro de autenticação. Faça login novamente.');
  }

  const { data, error } = await supabase.functions.invoke('create-user-by-moderator', {
    body: userData,
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  if (error) {
    console.error('❌ Erro na edge function:', error);
    throw new Error(error.message || 'Erro ao criar usuário');
  }

  // Verificar se a resposta contém erro mesmo quando status é 200
  if (data?.error) {
    console.error('❌ Erro retornado pela edge function:', data.error);
    throw new Error(data.error);
  }

  if (!data?.success || !data?.userId) {
    console.error('❌ Resposta inválida da edge function:', data);
    throw new Error(data?.error || 'Resposta inválida do servidor');
  }

  console.log('✅ Usuário criado via edge function:', data.userId);
  return data;
};

// Esta função não é mais necessária pois a edge function já faz o registro
export const registerUserCreatedByModerator = async (userId: string): Promise<void> => {
  // A edge function create-user-by-moderator já registra automaticamente 
  // na tabela moderator_users, então esta função é apenas um placeholder
  console.log('📝 Registro de criação de usuário já foi feito pela edge function:', userId);
};
