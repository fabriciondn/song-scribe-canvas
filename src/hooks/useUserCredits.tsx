import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useImpersonation } from '@/context/ImpersonationContext';
import { supabase } from '@/integrations/supabase/client';

export const useUserCredits = () => {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = isImpersonating && impersonatedUser ? impersonatedUser.id : user?.id;

  const fetchCredits = useCallback(async () => {
    if (!currentUserId) {
      setCredits(0);
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Buscando créditos para usuário:', currentUserId, isImpersonating ? '(impersonado)' : '(real)');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', currentUserId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar créditos:', error);
        setError('Erro ao carregar créditos');
        setCredits(0);
      } else {
        console.log('✅ Créditos encontrados:', data?.credits || 0);
        setCredits(data?.credits || 0);
        setError(null);
      }
    } catch (err) {
      console.error('❌ Erro inesperado:', err);
      setError('Erro ao carregar créditos');
      setCredits(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, isImpersonating]);

  useEffect(() => {
    console.log('🔄 useUserCredits: currentUserId mudou:', currentUserId, 'isImpersonating:', isImpersonating);
    
    // Reset credits when switching users
    setCredits(null);
    setIsLoading(true);
    setError(null);
    
    fetchCredits();

    if (!currentUserId) return;

    // Configurar listener para mudanças em tempo real
    const channel = supabase
      .channel(`credits-changes-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log('💳 Créditos atualizados em tempo real:', payload.new.credits);
          setCredits(payload.new.credits || 0);
        }
      )
      .subscribe();

    // Também escutar mudanças de transações de moderador que podem afetar créditos
    const transactionChannel = supabase
      .channel(`moderator-transactions-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moderator_transactions',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log('💰 Transação de moderador detectada, atualizando créditos:', payload);
          // Aguardar um pouco e refrescar os créditos
          setTimeout(() => {
            fetchCredits();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(transactionChannel);
    };
  }, [currentUserId, fetchCredits, isImpersonating]);

  const refreshCredits = async () => {
    setIsLoading(true);
    setError(null);
    await fetchCredits();
  };

  return {
    credits,
    isLoading,
    error,
    refreshCredits,
  };
};