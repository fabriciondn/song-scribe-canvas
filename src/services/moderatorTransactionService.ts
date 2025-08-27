
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
  // Criar nova transação e descontar créditos do moderador
  async createTransaction(userId: string, amount: number, description: string): Promise<boolean> {
    // Primeiro, verificar se o moderador tem créditos suficientes
    const { data: moderatorProfile, error: moderatorError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (moderatorError) {
      console.error('Erro ao buscar créditos do moderador:', moderatorError);
      throw new Error('Erro ao verificar créditos do moderador');
    }

    if (!moderatorProfile || moderatorProfile.credits < amount) {
      throw new Error(`Créditos insuficientes. Você tem ${moderatorProfile?.credits || 0} créditos mas precisa de ${amount}.`);
    }

    // Usar a função RPC que já desconta do moderador
    const { data, error } = await supabase.rpc('update_user_credits', {
      target_user_id: userId,
      credit_amount: amount,
      transaction_description: description
    });

    if (error) {
      console.error('Erro ao criar transação:', error);
      throw new Error(error.message || 'Erro ao criar transação');
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
