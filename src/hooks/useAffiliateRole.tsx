import { useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ImpersonationContext } from '@/context/ImpersonationContext';

const AFFILIATE_CACHE_KEY = 'affiliate_role_cache';

const getCachedAffiliateRole = (userId: string): boolean | null => {
  try {
    const cached = sessionStorage.getItem(AFFILIATE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.userId === userId) {
        return parsed.isAffiliate;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
};

const setCachedAffiliateRole = (userId: string, isAffiliate: boolean) => {
  try {
    sessionStorage.setItem(AFFILIATE_CACHE_KEY, JSON.stringify({ userId, isAffiliate }));
  } catch {
    // Ignore cache errors
  }
};

export const useAffiliateRole = () => {
  const { user } = useAuth();
  
  const impersonationContext = useContext(ImpersonationContext);
  const isImpersonating = impersonationContext?.isImpersonating || false;
  const impersonatedUser = impersonationContext?.impersonatedUser;
  
  const currentUserId = isImpersonating && impersonatedUser?.id ? impersonatedUser.id : user?.id;
  
  // Inicializar com cache para evitar flash
  const cachedValue = currentUserId ? getCachedAffiliateRole(currentUserId) : null;
  const [isAffiliate, setIsAffiliate] = useState(cachedValue ?? false);
  const [isLoading, setIsLoading] = useState(cachedValue === null);
  
  const lastFetchedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUserId) {
      setIsAffiliate(false);
      setIsLoading(false);
      return;
    }

    // Se já buscamos para este usuário, não buscar novamente
    if (lastFetchedUserId.current === currentUserId) {
      return;
    }

    // Se temos cache, usar imediatamente sem loading
    const cached = getCachedAffiliateRole(currentUserId);
    if (cached !== null) {
      setIsAffiliate(cached);
      setIsLoading(false);
    }

    const checkAffiliateStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('affiliates')
          .select('status')
          .eq('user_id', currentUserId)
          .eq('status', 'approved')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao verificar status de afiliado:', error);
        }

        const affiliateStatus = !!data;
        setIsAffiliate(affiliateStatus);
        setCachedAffiliateRole(currentUserId, affiliateStatus);
        lastFetchedUserId.current = currentUserId;
      } catch (error) {
        console.error('Erro ao verificar status de afiliado:', error);
        setIsAffiliate(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAffiliateStatus();
  }, [currentUserId]);

  return { isAffiliate, isLoading };
};