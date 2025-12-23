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

// Função para selecionar a melhor subscription entre várias
const pickBestSubscription = (subscriptions: Subscription[]): Subscription | null => {
  if (!subscriptions || subscriptions.length === 0) return null;
  
  // Prioridade: active pro > active pendrive > trial > expired/free
  const priority = (sub: Subscription): number => {
    if (sub.status === 'active' && sub.plan_type === 'pro') return 4;
    if (sub.status === 'active' && sub.plan_type === 'pendrive') return 3;
    if (sub.status === 'trial') return 2;
    if (sub.status === 'active') return 1;
    return 0;
  };
  
  return subscriptions.reduce((best, current) => 
    priority(current) > priority(best) ? current : best
  , subscriptions[0]);
};

export const useSubscription = () => {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const currentUserId = isImpersonating && impersonatedUser?.id ? impersonatedUser.id : user?.id;
  
  // Inicializar com cache se disponível para evitar flickering
  const cachedSub = currentUserId ? getCachedSubscription(currentUserId) : null;
  const [subscription, setSubscription] = useState<Subscription | null>(cachedSub);
  const [isLoading, setIsLoading] = useState(!cachedSub);
  const [isHydrated, setIsHydrated] = useState(false); // Indica se já consultou o servidor
  const [error, setError] = useState<string | null>(null);
  const lastFetchedUserId = useRef<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!currentUserId) {
        setSubscription(null);
        setCachedSubscription(null);
        setIsLoading(false);
        setIsHydrated(true);
        return;
      }

      // Se já buscamos para este usuário, não precisa buscar novamente
      if (lastFetchedUserId.current === currentUserId && isHydrated) {
        return;
      }

      try {
        // Só mostra loading se não tiver cache
        const cached = getCachedSubscription(currentUserId);
        if (!cached) {
          setIsLoading(true);
        }
        setError(null);

        // Buscar últimas 5 subscriptions para escolher a melhor
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        // Selecionar a melhor subscription
        let bestSubscription = pickBestSubscription(data || []);

        if (bestSubscription) {
          // Verificar se subscription expirou (incluindo trial)
          const now = new Date();
          const expiresAt = bestSubscription.expires_at ? new Date(bestSubscription.expires_at) : null;
          
          if (expiresAt && now > expiresAt && (bestSubscription.status === 'active' || bestSubscription.status === 'trial')) {
            // Marcar como expirada
            const { data: updatedSub, error: updateError } = await supabase
              .from('subscriptions')
              .update({ status: 'expired' })
              .eq('id', bestSubscription.id)
              .select()
              .single();
            
            if (!updateError && updatedSub) {
              bestSubscription = updatedSub;
            }
          }
        }

        // Atualizar estado e cache
        setSubscription(bestSubscription);
        setCachedSubscription(bestSubscription);
        lastFetchedUserId.current = currentUserId;
      } catch (err) {
        console.error('Erro ao buscar subscription:', err);
        setError('Erro ao carregar subscription');
      } finally {
        setIsLoading(false);
        setIsHydrated(true); // Marca que já consultou o servidor
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
        .limit(5);

      if (error) throw error;
      
      const bestSubscription = pickBestSubscription(data || []);
      setSubscription(bestSubscription);
      setCachedSubscription(bestSubscription);
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
    isHydrated, // Novo: indica se já consultou o servidor
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