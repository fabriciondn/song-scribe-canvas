import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './useAuth';
import { useImpersonation } from '@/context/ImpersonationContext';
import { supabase } from '@/integrations/supabase/client';

export const useUserCredits = () => {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Memoizar o user ID para evitar re-renders desnecessários
  const currentUserId = useMemo(() => 
    isImpersonating && impersonatedUser ? impersonatedUser.id : user?.id,
    [isImpersonating, impersonatedUser?.id, user?.id]
  );

  // Usar ref para rastrear o último userId para evitar requests desnecessários
  const lastUserIdRef = useRef<string | undefined>();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Função de debounce para evitar requisições excessivas
  const debouncedFetchCredits = useCallback((userId: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('🔍 Buscando créditos para usuário:', userId, isImpersonating ? '(impersonado)' : '(real)');
        
        const { data, error } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
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
    }, 300); // 300ms de debounce
  }, [isImpersonating]);

  const fetchCredits = useCallback(async () => {
    if (!currentUserId) {
      setCredits(0);
      setIsLoading(false);
      return;
    }

    debouncedFetchCredits(currentUserId);
  }, [currentUserId, debouncedFetchCredits]);

  useEffect(() => {
    // Evitar requisições desnecessárias se o userId não mudou
    if (lastUserIdRef.current === currentUserId) {
      return;
    }

    console.log('🔄 useUserCredits: currentUserId mudou:', currentUserId, 'isImpersonating:', isImpersonating);
    
    // Limpar timeout anterior se existir
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Atualizar ref com novo userId
    lastUserIdRef.current = currentUserId;
    
    // Reset credits when switching users
    setCredits(null);
    setIsLoading(true);
    setError(null);
    
    fetchCredits();

    if (!currentUserId) return;

    // Configurar listener para mudanças em tempo real
    const channel = supabase
      .channel(`user-credits-${currentUserId}`)
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
          setError(null);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moderator_transactions',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log('💰 Transação de moderador detectada, refrescando créditos:', payload);
          // Recarregar créditos imediatamente após transação
          setTimeout(() => {
            if (lastUserIdRef.current === currentUserId) {
              fetchCredits();
            }
          }, 100); // Reduzir delay para atualização mais rápida
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchCredits, isImpersonating]);

  // Cleanup nos timeouts quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

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