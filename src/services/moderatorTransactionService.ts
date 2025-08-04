import { supabase } from '@/integrations/supabase/client';

export interface ModeratorTransaction {
  id: string;
  moderator_id: string;
  user_id: string;
  amount: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export const moderatorTransactionService = {
  // Criar nova transação
  async createTransaction(userId: string, amount: number, description: string): Promise<ModeratorTransaction> {
    // Buscar o ID do moderador atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('moderator_transactions')
      .insert({
        moderator_id: user.id,
        user_id: userId,
        amount,
        description
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar transação:', error);
      throw new Error('Erro ao criar transação');
    }

    return data;
  },

  // Buscar transações de um usuário específico
  async getUserTransactions(userId: string): Promise<ModeratorTransaction[]> {
    const { data, error } = await supabase
      .from('moderator_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações do usuário:', error);
      throw new Error('Erro ao buscar transações');
    }

    return data || [];
  },

  // Buscar todas as transações criadas pelo moderador atual
  async getModeratorTransactions(): Promise<ModeratorTransaction[]> {
    const { data, error } = await supabase
      .from('moderator_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações do moderador:', error);
      throw new Error('Erro ao buscar transações');
    }

    return data || [];
  },

  // Calcular total de transações para um usuário
  async getUserTransactionTotal(userId: string): Promise<number> {
    const transactions = await this.getUserTransactions(userId);
    return transactions.reduce((total, transaction) => total + Number(transaction.amount), 0);
  }
};