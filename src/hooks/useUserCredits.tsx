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
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

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
    // Evitar requisições desnecessárias se o userId não mudou
    if (lastUserIdRef.current === currentUserId) {
      return;
    }

    console.log('🔄 useUserCredits: currentUserId mudou:', currentUserId, 'isImpersonating:', isImpersonating);
    
    // Limpar intervalo anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Atualizar ref com novo userId
    lastUserIdRef.current = currentUserId;
    
    // Reset credits when switching users
    setCredits(null);
    setIsLoading(true);
    setError(null);
    
    // Buscar créditos imediatamente
    fetchCredits();

    if (!currentUserId) return;

    // Configurar realtime listener E polling como fallback
    const channel = supabase
      .channel(`user-credits-realtime-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log('💳 Créditos atualizados em tempo real via realtime:', payload.new.credits);
          setCredits(payload.new.credits || 0);
          setError(null);
        }
      )
      .subscribe();

    // Polling como backup para garantir atualizações
    pollingIntervalRef.current = setInterval(() => {
      if (lastUserIdRef.current === currentUserId) {
        console.log('🔄 Polling: verificando créditos...');
        fetchCredits();
      }
    }, 3000); // Verificar a cada 3 segundos

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchCredits, isImpersonating]);

  // Cleanup nos intervalos quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
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