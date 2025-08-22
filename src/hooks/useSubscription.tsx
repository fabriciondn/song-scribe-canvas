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

        // Se não tem subscription, criar uma free
        if (!data) {
          const { data: newSub, error: createError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: currentUserId,
              status: 'free',
              plan_type: 'free',
              auto_renew: false,
              currency: 'BRL'
            })
            .select()
            .single();

          if (createError) throw createError;
          setSubscription(newSub);
        } else {
          // Verificar se subscription expirou
          const now = new Date();
          const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
          
          if (expiresAt && now > expiresAt && data.status === 'active') {
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
    isPro: subscription?.status === 'active' && subscription?.plan_type === 'pro',
    isFree: !subscription || subscription.plan_type === 'free' || subscription.status !== 'active'
  };
};