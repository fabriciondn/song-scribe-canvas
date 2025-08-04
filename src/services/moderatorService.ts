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
  const { data, error } = await supabase.rpc('get_moderator_dashboard_stats');
  
  if (error) {
    console.error('Error fetching moderator dashboard stats:', error);
    throw new Error('Erro ao carregar estatísticas do moderador');
  }
  
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    return data as unknown as ModeratorDashboardStats;
  }
  
  return {
    total_managed_users: 0,
    total_managed_songs: 0,
    total_managed_drafts: 0,
    total_managed_registered_works: 0,
    total_credits_distributed: 0
  };
};

// Buscar usuários gerenciados pelo moderador
export const getManagedUsers = async (): Promise<ManagedUserData[]> => {
  // Fazemos duas consultas separadas para evitar problemas de join
  const { data: moderatorUsers, error: moderatorError } = await supabase
    .from('moderator_users')
    .select('user_id, created_at')
    .order('created_at', { ascending: false });

  if (moderatorError) {
    console.error('Error fetching moderator users:', moderatorError);
    throw new Error('Erro ao carregar usuários gerenciados');
  }

  if (!moderatorUsers || moderatorUsers.length === 0) {
    return [];
  }

  const userIds = moderatorUsers.map(mu => mu.user_id);
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, email, artistic_name, credits')
    .in('id', userIds);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw new Error('Erro ao carregar perfis dos usuários');
  }

  // Combinar os dados
  return moderatorUsers.map(mu => {
    const profile = profiles?.find(p => p.id === mu.user_id);
    return {
      id: mu.user_id,
      name: profile?.name || null,
      email: profile?.email || null,
      artistic_name: profile?.artistic_name || null,
      credits: profile?.credits || 0,
      created_at: mu.created_at
    };
  });
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
  // Esta função precisará ser implementada via Edge Function
  // pois criar usuários requer privilégios administrativos
  const { data, error } = await supabase.functions.invoke('create-user-by-moderator', {
    body: userData
  });

  if (error) {
    console.error('Error creating user:', error);
    throw new Error('Erro ao criar usuário');
  }

  return data;
};

// Registrar que um usuário foi criado por um moderador
export const registerUserCreatedByModerator = async (userId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { error } = await supabase
    .from('moderator_users')
    .insert({
      moderator_id: user.id,
      user_id: userId
    });

  if (error) {
    console.error('Error registering user creation:', error);
    throw new Error('Erro ao registrar criação de usuário');
  }
};