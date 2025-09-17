import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/context/ImpersonationContext';

export const useAffiliateRole = () => {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = isImpersonating && impersonatedUser?.id ? impersonatedUser.id : user?.id;

  useEffect(() => {
    if (!currentUserId) {
      setIsAffiliate(false);
      setIsLoading(false);
      return;
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

        setIsAffiliate(!!data);
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