
import { useImpersonation } from '@/context/ImpersonationContext';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useAffiliateRole } from '@/hooks/useAffiliateRole';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  isPro: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isAffiliate: boolean;
  isLoading: boolean;
  role: 'admin' | 'moderator' | 'affiliate' | 'user';
}

export const useUserRole = (): UserRole => {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const { isPro: subscriptionIsPro, isLoading: subscriptionLoading } = useSubscription();
  const { isAffiliate, isLoading: affiliateLoading } = useAffiliateRole();
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  const currentUserId = useMemo(() => {
    return isImpersonating && impersonatedUser?.id ? impersonatedUser.id : user?.id;
  }, [user?.id, isImpersonating, impersonatedUser?.id]);

  // Buscar role administrativo apenas uma vez por usuário
  useEffect(() => {
    if (!currentUserId) {
      setAdminRole(null);
      setAdminLoading(false);
      return;
    }

    const fetchAdminRole = async () => {
      try {
        console.log('🔍 useUserRole: Verificando role administrativo para:', currentUserId);
        
        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', currentUserId)
          .single();

        if (adminData && !error) {
          const normalizedRole = adminData.role === 'super_admin' ? 'admin' : adminData.role;
          console.log('✅ useUserRole: Role administrativo encontrado:', normalizedRole);
          setAdminRole(normalizedRole);
        } else {
          console.log('📋 useUserRole: Usuário comum, sem role administrativo');
          setAdminRole(null);
        }
      } catch (error) {
        console.error('❌ useUserRole: Erro ao buscar role administrativo:', error);
        setAdminRole(null);
      } finally {
        setAdminLoading(false);
      }
    };

    fetchAdminRole();
  }, [currentUserId]);

  // Calcular o role final baseado nos dados carregados
  const finalRole = useMemo((): UserRole => {
    // Se ainda está carregando dados essenciais
    if (!currentUserId) {
      return {
        isPro: false,
        isAdmin: false,
        isModerator: false,
        isAffiliate: false,
        isLoading: false,
        role: 'user'
      };
    }

    if (adminLoading || subscriptionLoading || affiliateLoading) {
      return {
        isPro: false,
        isAdmin: false,
        isModerator: false,
        isAffiliate: false,
        isLoading: true,
        role: 'user'
      };
    }

    const isAdmin = adminRole === 'admin';
    const isModerator = adminRole === 'moderator';
    
    // Admins sempre têm acesso Pro, outros dependem da subscription
    const isPro = isAdmin || subscriptionIsPro;

    console.log('🎯 useUserRole: Estado final:', {
      adminRole,
      subscriptionIsPro,
      isPro,
      isAdmin,
      isModerator,
      isAffiliate
    });

    // Determinar role final baseado na hierarquia
    let finalRole: 'admin' | 'moderator' | 'affiliate' | 'user' = 'user';
    if (isAdmin) finalRole = 'admin';
    else if (isModerator) finalRole = 'moderator'; 
    else if (isAffiliate) finalRole = 'affiliate';

    return {
      isPro,
      isAdmin,
      isModerator,
      isAffiliate,
      isLoading: false,
      role: finalRole
    };
  }, [currentUserId, adminRole, adminLoading, subscriptionIsPro, subscriptionLoading, isAffiliate, affiliateLoading]);

  return finalRole;
};
