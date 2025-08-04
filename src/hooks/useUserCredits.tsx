import { useState, useEffect } from 'react';
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

  const fetchCredits = async () => {
    if (!currentUserId) {
      setCredits(0);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', currentUserId)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
        setError('Erro ao carregar créditos');
        setCredits(0);
      } else {
        setCredits(data?.credits || 0);
        setError(null);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Erro ao carregar créditos');
      setCredits(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
          console.log('Créditos atualizados em tempo real:', payload);
          setCredits(payload.new.credits || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

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