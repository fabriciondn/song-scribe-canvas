import { useImpersonation } from '@/context/ImpersonationContext';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan_type: string;
  started_at?: string;
  expires_at?: string;
  auto_renew: boolean;
  payment_provider?: string;
  payment_provider_subscription_id?: string;
  amount?: number;
  currency: string;
}

// Cache key para sessionStorage
const SUBSCRIPTION_CACHE_KEY = 'user_subscription_cache';

// Função para obter subscription do cache
const getCachedSubscription = (userId: string): Subscription | null => {
  try {
    const cached = sessionStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Verificar se o cache é do mesmo usuário
      if (parsed.user_id === userId) {
        return parsed;
      }
    }
  } catch {
    // Ignorar erros de parse
  }
  return null;
};

// Função para salvar subscription no cache
const setCachedSubscription = (subscription: Subscription | null) => {
  try {
    if (subscription) {
      sessionStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(subscription));
    } else {
      sessionStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
    }
  } catch {
    // Ignorar erros de storage
  }
};

export const useSubscription = () => {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const currentUserId = isImpersonating && impersonatedUser?.id ? impersonatedUser.id : user?.id;
  
  // Inicializar com cache se disponível para evitar flickering
  const cachedSub = currentUserId ? getCachedSubscription(currentUserId) : null;
  const [subscription, setSubscription] = useState<Subscription | null>(cachedSub);
  const [isLoading, setIsLoading] = useState(!cachedSub); // Se tem cache, não está carregando
  const [error, setError] = useState<string | null>(null);
  const lastFetchedUserId = useRef<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!currentUserId) {
        setSubscription(null);
        setCachedSubscription(null);
        setIsLoading(false);
        return;
      }

      // Se já buscamos para este usuário e temos cache, não precisa mostrar loading
      const cached = getCachedSubscription(currentUserId);
      if (cached && lastFetchedUserId.current === currentUserId) {
        return;
      }

      try {
        // Só mostra loading se não tiver cache
        if (!cached) {
          setIsLoading(true);
        }
        setError(null);

        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        let finalSubscription = data;

        if (data) {
          // Verificar se subscription expirou (incluindo trial)
          const now = new Date();
          const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
          
          if (expiresAt && now > expiresAt && (data.status === 'active' || data.status === 'trial')) {
            // Marcar como expirada
            const { data: updatedSub, error: updateError } = await supabase
              .from('subscriptions')
              .update({ status: 'expired' })
              .eq('id', data.id)
              .select()
              .single();
            
            if (updateError) throw updateError;
            finalSubscription = updatedSub;
          }
        } else {
          // Se não tem subscription, o trigger já deve ter criado uma trial
          // Mas vamos verificar novamente
          const { data: retryData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          finalSubscription = retryData;
        }

        // Atualizar estado e cache
        setSubscription(finalSubscription);
        setCachedSubscription(finalSubscription);
        lastFetchedUserId.current = currentUserId;
      } catch (err) {
        console.error('Erro ao buscar subscription:', err);
        setError('Erro ao carregar subscription');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [currentUserId]);

  const refreshSubscription = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
      setCachedSubscription(data);
    } catch (err) {
      console.error('Erro ao atualizar subscription:', err);
    }
  };

  const isActive = subscription?.status === 'active' || subscription?.status === 'trial';
  const isPendrive = subscription?.plan_type === 'pendrive' && isActive;
  const isPro = (subscription?.plan_type === 'pro' && isActive) || subscription?.status === 'trial';
  
  // Pendrive access: has pendrive OR pro subscription
  const hasPendriveAccess = isPendrive || isPro;

  return {
    subscription,
    isLoading,
    error,
    refreshSubscription,
    isPro,
    isPendrive,
    hasPendriveAccess,
    isFree: !subscription || subscription.status === 'expired' || subscription.status === 'free',
    isTrialActive: subscription?.status === 'trial',
    trialDaysRemaining: subscription?.status === 'trial' && subscription.expires_at 
      ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : 0
  };
};