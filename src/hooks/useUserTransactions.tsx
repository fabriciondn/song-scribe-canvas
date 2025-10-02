
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
  status: 'pending' | 'completed' | 'failed' | 'active' | 'expired';
  created_at: string;
  completed_at?: string;
  metadata?: any;
  transaction_type: 'credits' | 'subscription';
  plan_type?: string;
}

export const useUserTransactions = () => {
  const { user } = useAuth();

  const { data: transactions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['user-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Buscar transações de créditos
      const { data: creditData, error: creditError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (creditError) throw creditError;

      // Buscar assinaturas
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (subscriptionError) throw subscriptionError;
      
      // Mapear transações de créditos
      const creditTransactions = (creditData || []).map(transaction => {
        // Determinar o método de pagamento baseado no payment_id ou payment_provider
        let paymentMethod = 'Mercado Pago';
        if (transaction.payment_id && transaction.payment_id.toLowerCase().includes('pix')) {
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
          transaction_type: 'credits' as const,
          metadata: {}
        };
      });

      // Mapear assinaturas
      const subscriptionTransactions = (subscriptionData || []).map(subscription => {
        // Determinar o método de pagamento baseado no payment_provider
        let paymentMethod = 'PIX';
        if (subscription.payment_provider === 'mercadopago') {
          paymentMethod = 'PIX'; // Mercado Pago via PIX
        } else if (subscription.payment_provider === 'stripe') {
          paymentMethod = 'Cartão de Crédito';
        }

        // Normalizar status para interface
        let normalizedStatus: 'pending' | 'completed' | 'failed' | 'active' | 'expired' = 'pending';
        if (subscription.status === 'active') {
          normalizedStatus = 'active';
        } else if (subscription.status === 'expired') {
          normalizedStatus = 'expired';
        } else if (subscription.status === 'trial') {
          normalizedStatus = 'active';
        }

        return {
          id: subscription.id,
          user_id: subscription.user_id,
          amount: subscription.amount || 0,
          bonus_credits: 0,
          total_credits: 0,
          payment_id: subscription.payment_provider_subscription_id || 'Assinatura',
          payment_method: paymentMethod,
          status: normalizedStatus,
          created_at: subscription.created_at,
          completed_at: subscription.started_at,
          transaction_type: 'subscription' as const,
          plan_type: subscription.plan_type,
          metadata: {}
        };
      });

      // Combinar e ordenar por data
      const allTransactions = [...creditTransactions, ...subscriptionTransactions]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return allTransactions as UserTransaction[];
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return { color: 'bg-green-500', text: 'Ativo' };
      case 'pending':
        return { color: 'bg-yellow-500', text: 'Pendente' };
      case 'failed':
        return { color: 'bg-red-500', text: 'Falhou' };
      case 'expired':
        return { color: 'bg-gray-500', text: 'Expirado' };
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
