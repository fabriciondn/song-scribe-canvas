
import { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { ImpersonationContext } from '@/context/ImpersonationContext';
import { supabase } from '@/integrations/supabase/client';

export const useUserCredits = () => {
  // Usar os contextos diretamente para evitar conflitos
  const authContext = useContext(AuthContext);
  const impersonationContext = useContext(ImpersonationContext);
  
  // Pegar o usuário real do auth (não o modificado por impersonação)
  const realUser = authContext?.user;
  const isImpersonating = impersonationContext?.isImpersonating || false;
  const impersonatedUser = impersonationContext?.impersonatedUser;
  
  const [credits, setCredits] = useState<number | null>(null);
  const [monthlyRemaining, setMonthlyRemaining] = useState(0);
  const [isLaunch, setIsLaunch] = useState(false);
  const [cycleEnd, setCycleEnd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Determinar o userId correto: se impersonando, usar o impersonado; senão, usar o real
  const currentUserId = useMemo(() => {
    if (isImpersonating && impersonatedUser) {
      return impersonatedUser.id;
    }
    return realUser?.id;
  }, [isImpersonating, impersonatedUser?.id, realUser?.id]);

  // Usar ref para rastrear o último userId para evitar requests desnecessários
  const lastUserIdRef = useRef<string | undefined>();
  const lastImpersonatingRef = useRef<boolean>(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

  const fetchCredits = useCallback(async () => {
    if (!currentUserId) {
      // Não definir como 0 aqui - deixar null até termos o userId
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
        const {data: balance, error: balanceError} = await supabase.rpc('get_registration_balance',{p_user_id:currentUserId});
        if (balanceError) throw balanceError;
        const value = balance && typeof balance === 'object' && !Array.isArray(balance) ? balance : {};
        setMonthlyRemaining(Number(value.monthly_remaining || 0));
        setIsLaunch(value.is_launch === true);
        setCycleEnd(typeof value.cycle_end === 'string' ? value.cycle_end : null);
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
    // Detectar mudança no userId OU no estado de impersonação
    const userChanged = lastUserIdRef.current !== currentUserId;
    const impersonationChanged = lastImpersonatingRef.current !== isImpersonating;
    const shouldRefresh = userChanged || impersonationChanged;
    
    console.log('🔄 useUserCredits: currentUserId:', currentUserId, 'isImpersonating:', isImpersonating, 'changed:', shouldRefresh);
    
    // Limpar intervalo anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Atualizar refs
    lastUserIdRef.current = currentUserId;
    lastImpersonatingRef.current = isImpersonating;
    
    // Reset credits when switching users or impersonation state
    if (shouldRefresh) {
      setCredits(null);
      setIsLoading(true);
      setError(null);
    }
    
    if (!currentUserId) {
      // Não definir como 0 - deixar null até autenticação carregar
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
    monthlyRemaining,
    isLaunch,
    cycleEnd,
    availableRegistrationCredits: (credits || 0) + monthlyRemaining,
    isLoading,
    error,
    refreshCredits,
  };
};
