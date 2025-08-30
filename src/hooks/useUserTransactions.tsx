
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
      return (data || []) as UserTransaction[];
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
    }).format(value / 100); // Convertendo de centavos para reais
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
