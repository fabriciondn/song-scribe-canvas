import { useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ImpersonationContext } from '@/context/ImpersonationContext';

export const useAffiliateRole = () => {
  const { user } = useAuth();
  
  // Usar contexto de forma segura (pode não existir em algumas rotas)
  const impersonationContext = useContext(ImpersonationContext);
  const isImpersonating = impersonationContext?.isImpersonating || false;
  const impersonatedUser = impersonationContext?.impersonatedUser;
  
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