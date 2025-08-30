
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
      console.log('🔍 Fetching credits for user:', currentUserId, isImpersonating ? '(impersonated)' : '(real)');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', currentUserId)
        .single();

      if (error) {
        console.error('❌ Error fetching credits:', error);
        setError('Erro ao carregar créditos');
        setCredits(0);
      } else {
        const newCredits = data?.credits || 0;
        console.log('✅ Credits found:', newCredits);
        
        // Se houve mudança significativa nos créditos, disparar evento
        if (credits !== null && newCredits > credits) {
          console.log('💰 Credits increased! Dispatching event');
          window.dispatchEvent(new CustomEvent('credits-increased', { 
            detail: { 
              oldCredits: credits, 
              newCredits,
              difference: newCredits - credits
            }
          }));
        }
        
        setCredits(newCredits);
        setError(null);
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('Erro ao carregar créditos');
      setCredits(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, isImpersonating, credits]);

  useEffect(() => {
    // Evitar requisições desnecessárias se o userId não mudou
    if (lastUserIdRef.current === currentUserId && currentUserId) {
      return;
    }

    console.log('🔄 useUserCredits: currentUserId changed:', currentUserId, 'isImpersonating:', isImpersonating);
    
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

    // Configurar polling mais agressivo durante pagamentos
    pollingIntervalRef.current = setInterval(() => {
      if (lastUserIdRef.current === currentUserId) {
        fetchCredits();
      }
    }, 3000); // Verificar a cada 3 segundos

    // Configurar realtime listener
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
          console.log('💳 Credits change detected via realtime:', payload);
          if (payload.new && 'credits' in payload.new) {
            const newCredits = payload.new.credits || 0;
            console.log('💰 Updating credits via realtime:', newCredits);
            
            // Disparar evento se houve aumento
            if (credits !== null && newCredits > credits) {
              window.dispatchEvent(new CustomEvent('credits-increased', { 
                detail: { 
                  oldCredits: credits, 
                  newCredits,
                  difference: newCredits - credits
                }
              }));
            }
            
            setCredits(newCredits);
            setError(null);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime channel status:', status);
      });

    // Listener para eventos customizados de atualização
    const handleCreditsUpdate = () => {
      console.log('🔄 Manual credits update requested');
      fetchCredits();
    };

    window.addEventListener('credits-updated', handleCreditsUpdate);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      supabase.removeChannel(channel);
      window.removeEventListener('credits-updated', handleCreditsUpdate);
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
