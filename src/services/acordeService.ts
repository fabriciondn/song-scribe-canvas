import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface AcordeAction {
  id: string;
  action_key: string;
  name: string;
  description: string | null;
  acordes_reward: number;
  is_active: boolean;
  icon: string | null;
  max_per_user: number | null;
  created_at: string;
  updated_at: string;
}

export interface AcordeHistory {
  id: string;
  acordes_earned: number;
  description: string | null;
  created_at: string;
  action_name: string;
  action_icon: string | null;
}

export interface UserAcordesProgress {
  total_acordes: number;
  redeemed_acordes: number;
  available_acordes: number;
  progress_percentage: number;
  can_redeem: boolean;
  credits_available: number;
  acordes_to_next_credit: number;
  available_actions: {
    id: string;
    action_key: string;
    name: string;
    description: string | null;
    acordes_reward: number;
    icon: string | null;
    max_per_user: number | null;
    user_completed: number;
    can_complete: boolean;
  }[];
  recent_history: AcordeHistory[];
}

export interface AcordeStats {
  total_acordes_distributed: number;
  total_acordes_redeemed: number;
  total_users_with_acordes: number;
  total_redemptions: number;
}

// Buscar progresso do usuário
export const getUserAcordesProgress = async (userId: string): Promise<UserAcordesProgress | null> => {
  const { data, error } = await supabase.rpc('get_user_acordes_progress', {
    p_user_id: userId
  });

  if (error) {
    console.error('Error fetching acordes progress:', error);
    return null;
  }

  if (!data) return null;

  // Cast the Json response to our expected type
  const result = data as unknown as UserAcordesProgress;
  return result;
};

// Resgatar acordes
export const redeemAcordes = async (userId: string): Promise<{ success: boolean; message: string; credits_received?: number }> => {
  const { data, error } = await supabase.rpc('redeem_acordes', {
    p_user_id: userId
  });

  if (error) {
    console.error('Error redeeming acordes:', error);
    return { success: false, message: error.message };
  }

  const result = data as unknown as { success: boolean; error?: string; credits_received?: number; acordes_redeemed?: number };
  
  if (!result.success) {
    return { success: false, message: result.error || 'Erro ao resgatar acordes' };
  }

  return { 
    success: true, 
    message: `Resgatados ${result.acordes_redeemed} acordes por ${result.credits_received} crédito(s)!`,
    credits_received: result.credits_received
  };
};

// Admin: Buscar todas as ações
export const getAcordeActions = async (): Promise<AcordeAction[]> => {
  const { data, error } = await supabase
    .from('acorde_actions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching acorde actions:', error);
    return [];
  }

  return data as AcordeAction[];
};

// Admin: Criar nova ação
export const createAcordeAction = async (action: Omit<AcordeAction, 'id' | 'created_at' | 'updated_at'>): Promise<AcordeAction | null> => {
  const { data, error } = await supabase
    .from('acorde_actions')
    .insert(action)
    .select()
    .single();

  if (error) {
    console.error('Error creating acorde action:', error);
    return null;
  }

  return data as AcordeAction;
};

// Admin: Atualizar ação
export const updateAcordeAction = async (id: string, updates: Partial<AcordeAction>): Promise<boolean> => {
  const { error } = await supabase
    .from('acorde_actions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating acorde action:', error);
    return false;
  }

  return true;
};

// Admin: Deletar ação
export const deleteAcordeAction = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('acorde_actions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting acorde action:', error);
    return false;
  }

  return true;
};

// Admin: Buscar estatísticas
export const getAcordeStats = async (): Promise<AcordeStats> => {
  // Total de acordes distribuídos
  const { data: historyData } = await supabase
    .from('acorde_history')
    .select('acordes_earned');
  
  const totalDistributed = historyData?.reduce((sum, h) => sum + (h.acordes_earned || 0), 0) || 0;

  // Total de acordes resgatados
  const { data: redemptionsData } = await supabase
    .from('acorde_redemptions')
    .select('acordes_redeemed');
  
  const totalRedeemed = redemptionsData?.reduce((sum, r) => sum + (r.acordes_redeemed || 0), 0) || 0;

  // Total de usuários com acordes
  const { count: usersCount } = await supabase
    .from('user_acordes')
    .select('*', { count: 'exact', head: true });

  // Total de resgates
  const { count: redemptionsCount } = await supabase
    .from('acorde_redemptions')
    .select('*', { count: 'exact', head: true });

  return {
    total_acordes_distributed: totalDistributed,
    total_acordes_redeemed: totalRedeemed,
    total_users_with_acordes: usersCount || 0,
    total_redemptions: redemptionsCount || 0
  };
};
