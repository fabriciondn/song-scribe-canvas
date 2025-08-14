import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  isPro: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
}

export const useUserRole = (): UserRole => {
  const { user } = useAuth();
  const { isPro: subscriptionIsPro, isLoading: subscriptionLoading } = useSubscription();
  const [role, setRole] = useState<UserRole>({
    isPro: false,
    isAdmin: false,
    isModerator: false,
    isLoading: true,
  });

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        setRole({
          isPro: false,
          isAdmin: false,
          isModerator: false,
          isLoading: false,
        });
        return;
      }

      try {
        // Verificar se é admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (adminData) {
          setRole({
            isPro: true, // Admins sempre têm acesso Pro
            isAdmin: adminData.role === 'admin',
            isModerator: adminData.role === 'moderator',
            isLoading: false,
          });
          return;
        }

        // Para usuários normais, verificar subscription
        if (!subscriptionLoading) {
          setRole({
            isPro: subscriptionIsPro,
            isAdmin: false,
            isModerator: false,
            isLoading: false,
          });
        }

      } catch (error) {
        console.error('Erro ao buscar role do usuário:', error);
        setRole({
          isPro: false,
          isAdmin: false,
          isModerator: false,
          isLoading: false,
        });
      }
    };

    fetchUserRole();
  }, [user?.id, subscriptionIsPro, subscriptionLoading]);

  return role;
};