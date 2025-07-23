import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUserCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) {
        setCredits(0);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching credits:', error);
          setError('Erro ao carregar créditos');
          setCredits(0);
        } else {
          setCredits(data?.credits || 0);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Erro ao carregar créditos');
        setCredits(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredits();
  }, [user]);

  const refreshCredits = () => {
    setIsLoading(true);
    setError(null);
    // Re-trigger the effect
    if (user) {
      supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            setError('Erro ao carregar créditos');
            setCredits(0);
          } else {
            setCredits(data?.credits || 0);
          }
          setIsLoading(false);
        });
    }
  };

  return {
    credits,
    isLoading,
    error,
    refreshCredits,
  };
};