import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface WithdrawalRequest {
  id: string;
  affiliate_id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_details: any;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  affiliate: {
    user_id: string;
    affiliate_code: string;
    level: string;
    total_earnings: number;
    profile: Array<{
      name: string;
      email: string;
      avatar_url: string | null;
    }>;
  };
}

interface WithdrawalStats {
  pending: number;
  approved: number;
  paid: number;
  totalAmount: number;
  paidThisMonth: number;
}

export const useAffiliateWithdrawals = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<WithdrawalStats>({
    pending: 0,
    approved: 0,
    paid: 0,
    totalAmount: 0,
    paidThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadWithdrawals = useCallback(async () => {
    if (!user) return;

    try {
      // Buscar solicitações com dados do afiliado
      const { data: withdrawalsData, error } = await supabase
        .from('affiliate_withdrawal_requests')
        .select(`
          *,
          affiliates!inner(
            user_id,
            affiliate_code,
            level,
            total_earnings
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Buscar perfis dos afiliados
      const userIds = withdrawalsData?.map(w => w.affiliates.user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', userIds);

      // Combinar dados
      const data = withdrawalsData?.map(w => ({
        ...w,
        affiliate: {
          ...w.affiliates,
          profile: profiles?.filter(p => p.id === w.affiliates.user_id) || []
        }
      }));

      setWithdrawals(data || []);

      // Calcular estatísticas
      const pending = data?.filter(w => w.status === 'pending').length || 0;
      const approved = data?.filter(w => w.status === 'approved').length || 0;
      const paid = data?.filter(w => w.status === 'paid').length || 0;
      
      const totalAmount = data
        ?.filter(w => w.status === 'pending' || w.status === 'approved')
        .reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const paidThisMonth = data
        ?.filter(w => w.status === 'paid' && new Date(w.processed_at!) >= startOfMonth)
        .length || 0;

      setStats({
        pending,
        approved,
        paid,
        totalAmount,
        paidThisMonth,
      });
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar solicitações de saque');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const approveWithdrawal = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('affiliate_withdrawal_requests')
        .update({
          status: 'approved',
          approved_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Saque aprovado! Aguardando processamento do pagamento.');
      loadWithdrawals();
    } catch (error) {
      console.error('Erro ao aprovar saque:', error);
      toast.error('Erro ao aprovar saque');
    }
  }, [user, loadWithdrawals]);

  const completePayment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.rpc('process_affiliate_withdrawal_payment', {
        p_withdrawal_id: id,
        p_admin_id: user?.id,
      });

      if (error) throw error;

      toast.success('Pagamento concluído! O saldo do afiliado foi atualizado.');
      loadWithdrawals();
    } catch (error: any) {
      console.error('Erro ao concluir pagamento:', error);
      toast.error(error.message || 'Erro ao concluir pagamento');
    }
  }, [user, loadWithdrawals]);

  const rejectWithdrawal = useCallback(async (id: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('affiliate_withdrawal_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Solicitação rejeitada');
      loadWithdrawals();
    } catch (error) {
      console.error('Erro ao rejeitar saque:', error);
      toast.error('Erro ao rejeitar saque');
    }
  }, [user, loadWithdrawals]);

  useEffect(() => {
    loadWithdrawals();

    // Listener para novas solicitações (INSERT)
    const insertChannel = supabase
      .channel('admin-withdrawal-inserts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'affiliate_withdrawal_requests',
        },
        (payload) => {
          console.log('Nova solicitação de saque:', payload);
          toast.info('🔔 Nova solicitação de saque recebida!', {
            duration: 5000,
          });
          loadWithdrawals();
        }
      )
      .subscribe();

    // Listener para atualizações (UPDATE)
    const updateChannel = supabase
      .channel('admin-withdrawal-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'affiliate_withdrawal_requests',
        },
        () => {
          loadWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(insertChannel);
      supabase.removeChannel(updateChannel);
    };
  }, [loadWithdrawals]);

  return {
    withdrawals,
    stats,
    isLoading,
    approveWithdrawal,
    completePayment,
    rejectWithdrawal,
    refreshWithdrawals: loadWithdrawals,
  };
};
