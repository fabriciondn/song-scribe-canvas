import { ImpersonationContext } from '@/context/ImpersonationContext';
import { useState, useEffect, useMemo, useContext, useRef } from 'react';
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

const ADMIN_ROLE_CACHE_KEY = 'admin_role_cache';

const getCachedAdminRole = (userId: string): string | null => {
  try {
    const cached = sessionStorage.getItem(ADMIN_ROLE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.userId === userId) {
        return parsed.role;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
};

const setCachedAdminRole = (userId: string, role: string | null) => {
  try {
    sessionStorage.setItem(ADMIN_ROLE_CACHE_KEY, JSON.stringify({ userId, role }));
  } catch {
    // Ignore cache errors
  }
};

export const useUserRole = (): UserRole => {
  const { user } = useAuth();
  
  const impersonationContext = useContext(ImpersonationContext);
  const isImpersonating = impersonationContext?.isImpersonating || false;
  const impersonatedUser = impersonationContext?.impersonatedUser;
  
  const { isPro: subscriptionIsPro, isLoading: subscriptionLoading } = useSubscription();
  const { isAffiliate, isLoading: affiliateLoading } = useAffiliateRole();

  const currentUserId = useMemo(() => {
    return isImpersonating && impersonatedUser?.id ? impersonatedUser.id : user?.id;
  }, [user?.id, isImpersonating, impersonatedUser?.id]);

  // Inicializar com cache para evitar flash
  const cachedAdminRole = currentUserId ? getCachedAdminRole(currentUserId) : null;
  const [adminRole, setAdminRole] = useState<string | null>(cachedAdminRole);
  const [adminLoading, setAdminLoading] = useState(cachedAdminRole === null && !!currentUserId);
  
  const lastFetchedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUserId) {
      setAdminRole(null);
      setAdminLoading(false);
      return;
    }

    // Se já buscamos para este usuário, não buscar novamente
    if (lastFetchedUserId.current === currentUserId) {
      return;
    }

    // Se temos cache, usar imediatamente sem loading
    const cached = getCachedAdminRole(currentUserId);
    if (cached !== null) {
      setAdminRole(cached === 'null' ? null : cached);
      setAdminLoading(false);
    }

    const fetchAdminRole = async () => {
      try {
        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', currentUserId)
          .single();

        if (adminData && !error) {
          const normalizedRole = adminData.role === 'super_admin' ? 'admin' : adminData.role;
          setAdminRole(normalizedRole);
          setCachedAdminRole(currentUserId, normalizedRole);
        } else {
          setAdminRole(null);
          setCachedAdminRole(currentUserId, 'null');
        }
        lastFetchedUserId.current = currentUserId;
      } catch (error) {
        console.error('❌ useUserRole: Erro ao buscar role administrativo:', error);
        setAdminRole(null);
      } finally {
        setAdminLoading(false);
      }
    };

    fetchAdminRole();
  }, [currentUserId]);

  const finalRole = useMemo((): UserRole => {
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

    // Só mostrar loading se não temos cache disponível
    const hasCache = getCachedAdminRole(currentUserId) !== null;
    if (!hasCache && (adminLoading || subscriptionLoading || affiliateLoading)) {
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
    const isPro = isAdmin || subscriptionIsPro;

    let role: 'admin' | 'moderator' | 'affiliate' | 'user' = 'user';
    if (isAdmin) role = 'admin';
    else if (isModerator) role = 'moderator'; 
    else if (isAffiliate) role = 'affiliate';

    return {
      isPro,
      isAdmin,
      isModerator,
      isAffiliate,
      isLoading: false,
      role
    };
  }, [currentUserId, adminRole, adminLoading, subscriptionIsPro, subscriptionLoading, isAffiliate, affiliateLoading]);

  return finalRole;
};
