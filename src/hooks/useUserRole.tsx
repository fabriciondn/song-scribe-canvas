
import { useImpersonation } from '@/context/ImpersonationContext';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  isPro: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  role: 'admin' | 'moderator' | 'user';
}

export const useUserRole = (): UserRole => {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const { isPro: subscriptionIsPro, isLoading: subscriptionLoading } = useSubscription();
  const [role, setRole] = useState<UserRole>({
    isPro: false,
    isAdmin: false,
    isModerator: false,
    isLoading: true,
    role: 'user'
  });

  const fetchUserRole = useCallback(async (userId: string) => {
    if (!userId) {
      setRole({
        isPro: false,
        isAdmin: false,
        isModerator: false,
        isLoading: false,
        role: 'user'
      });
      return;
    }

    try {
      console.log('🔍 useUserRole: Verificando role para usuário:', userId);
      
      // Verificar se é admin/moderator na tabela admin_users
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (adminData && !error) {
        // Normalizar super_admin para admin
        const normalizedRole = adminData.role === 'super_admin' ? 'admin' : adminData.role;
        
        console.log('✅ useUserRole: Usuário tem role administrativo:', normalizedRole);
        
        setRole({
          isPro: normalizedRole === 'admin' ? true : subscriptionIsPro, // Apenas admins têm acesso Pro automático
          isAdmin: normalizedRole === 'admin',
          isModerator: normalizedRole === 'moderator',
          isLoading: false,
          role: normalizedRole as 'admin' | 'moderator' | 'user'
        });
        return;
      }

      // Usuário normal - verificar subscription (incluindo trial)
      if (!subscriptionLoading) {
        console.log('📋 useUserRole: Usuário comum, isPro:', subscriptionIsPro);
        setRole({
          isPro: subscriptionIsPro, // isPro já inclui trial no useSubscription
          isAdmin: false,
          isModerator: false,
          isLoading: false,
          role: 'user'
        });
      }

    } catch (error) {
      console.error('❌ useUserRole: Erro ao buscar role:', error);
      setRole({
        isPro: false,
        isAdmin: false,
        isModerator: false,
        isLoading: false,
        role: 'user'
      });
    }
  }, [subscriptionIsPro, subscriptionLoading]);

  useEffect(() => {
    const currentUserId = isImpersonating && impersonatedUser?.id ? impersonatedUser.id : user?.id;
    
    if (currentUserId) {
      fetchUserRole(currentUserId);
    } else {
      setRole({
        isPro: false,
        isAdmin: false,
        isModerator: false,
        isLoading: false,
        role: 'user'
      });
    }
  }, [user?.id, isImpersonating, impersonatedUser?.id, fetchUserRole]);

  return role;
};
