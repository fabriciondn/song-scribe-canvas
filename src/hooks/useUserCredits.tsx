
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
    if (lastUserIdRef.current === currentUserId && currentUserId) {
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
    
    if (!currentUserId) {
      setCredits(0);
      setIsLoading(false);
      return;
    }

    // Buscar créditos imediatamente
    fetchCredits();

    // Configurar polling mais agressivo para garantir atualizações em tempo real
    pollingIntervalRef.current = setInterval(() => {
      if (lastUserIdRef.current === currentUserId) {
        console.log('🔄 Polling: verificando créditos automaticamente...');
        fetchCredits();
      }
    }, 2000); // Verificar a cada 2 segundos para ser mais responsivo

    // Configurar realtime listener como adicional
    const channel = supabase
      .channel(`credits-live-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log('💳 Mudança detectada na tabela profiles:', payload);
          if (payload.new && 'credits' in payload.new) {
            console.log('💰 Atualizando créditos via realtime:', payload.new.credits);
            setCredits(payload.new.credits || 0);
            setError(null);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status do canal realtime:', status);
      });

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

  const refreshCredits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await fetchCredits();
  }, [fetchCredits]);

  return {
    credits,
    isLoading,
    error,
    refreshCredits,
  };
};
