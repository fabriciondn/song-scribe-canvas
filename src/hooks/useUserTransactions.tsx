
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserTransaction {
  id: string;
  user_id: string;
  amount: number;
  bonus_credits: number;
  total_credits: number;
  payment_id: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  metadata?: any;
}

export const useUserTransactions = () => {
  const { user } = useAuth();

  const { data: transactions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['user-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapear os dados da tabela para a interface UserTransaction
      return (data || []).map(transaction => {
        // Determinar o método de pagamento baseado no payment_id
        let paymentMethod = 'Mercado Pago';
        if (transaction.payment_id && transaction.payment_id.startsWith('pix_')) {
          paymentMethod = 'PIX';
        } else if (transaction.payment_provider === 'mercadopago') {
          paymentMethod = 'Mercado Pago';
        }

        return {
          id: transaction.id,
          user_id: transaction.user_id,
          amount: transaction.total_amount,
          bonus_credits: transaction.bonus_credits || 0,
          total_credits: transaction.credits_purchased + (transaction.bonus_credits || 0),
          payment_id: transaction.payment_id || '',
          payment_method: paymentMethod,
          status: transaction.status as 'pending' | 'completed' | 'failed',
          created_at: transaction.created_at,
          completed_at: transaction.completed_at,
          metadata: {}
        };
      }) as UserTransaction[];
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-500', text: 'Completado' };
      case 'pending':
        return { color: 'bg-yellow-500', text: 'Pendente' };
      case 'failed':
        return { color: 'bg-red-500', text: 'Falhou' };
      default:
        return { color: 'bg-gray-500', text: 'Desconhecido' };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value); // Valor já está em reais
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    transactions,
    isLoading,
    error,
    refetch,
    getStatusBadge,
    formatCurrency,
    formatDate
  };
};
