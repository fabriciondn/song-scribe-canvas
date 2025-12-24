import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useImpersonation } from '@/context/ImpersonationContext';
import { supabase } from '@/integrations/supabase/client';

interface BonusCredits {
  credits: number;
  is_frozen: boolean;
  frozen_at: string | null;
  expires_at: string | null;
}

export const useSubscriptionCredits = () => {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const [bonusCredits, setBonusCredits] = useState<BonusCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentUserId = useMemo(() => 
    isImpersonating && impersonatedUser ? impersonatedUser.id : user?.id,
    [isImpersonating, impersonatedUser?.id, user?.id]
  );

  const fetchBonusCredits = useCallback(async () => {
    if (!currentUserId) {
      setBonusCredits(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscription_credits_bonus')
        .select('credits, is_frozen, frozen_at, expires_at')
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching bonus credits:', error);
        setError('Erro ao carregar créditos bônus');
        setBonusCredits(null);
      } else {
        setBonusCredits(data || { credits: 0, is_frozen: false, frozen_at: null, expires_at: null });
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erro ao carregar créditos bônus');
      setBonusCredits(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    setIsLoading(true);
    fetchBonusCredits();
  }, [fetchBonusCredits]);

  // Calcular dias restantes para expiração
  const daysUntilExpiration = useMemo(() => {
    if (!bonusCredits?.expires_at) return null;
    const expiresAt = new Date(bonusCredits.expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [bonusCredits?.expires_at]);

  const refreshBonusCredits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await fetchBonusCredits();
  }, [fetchBonusCredits]);

  return {
    bonusCredits: bonusCredits?.credits || 0,
    isFrozen: bonusCredits?.is_frozen || false,
    frozenAt: bonusCredits?.frozen_at,
    expiresAt: bonusCredits?.expires_at,
    daysUntilExpiration,
    isLoading,
    error,
    refreshBonusCredits,
  };
};
