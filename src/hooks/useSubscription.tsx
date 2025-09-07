import { useImpersonation } from '@/context/ImpersonationContext';
import { useState, useEffect } from 'react';
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

export const useSubscription = () => {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      const currentUserId = isImpersonating && impersonatedUser?.id ? impersonatedUser.id : user?.id;
      if (!currentUserId) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

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
            setSubscription(updatedSub);
          } else {
            setSubscription(data);
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
          
          setSubscription(retryData);
        }
      } catch (err) {
        console.error('Erro ao buscar subscription:', err);
        setError('Erro ao carregar subscription');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user?.id, isImpersonating, impersonatedUser?.id]);

  const refreshSubscription = async () => {
    const currentUserId = isImpersonating && impersonatedUser?.id ? impersonatedUser.id : user?.id;
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
    } catch (err) {
      console.error('Erro ao atualizar subscription:', err);
    }
  };

  return {
    subscription,
    isLoading,
    error,
    refreshSubscription,
    isPro: subscription?.status === 'active' || subscription?.status === 'trial',
    isFree: !subscription || subscription.status === 'expired' || subscription.status === 'free',
    isTrialActive: subscription?.status === 'trial',
    trialDaysRemaining: subscription?.status === 'trial' && subscription.expires_at 
      ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : 0
  };
};