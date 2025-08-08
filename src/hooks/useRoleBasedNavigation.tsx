import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/context/ImpersonationContext';
import { withRateLimit, debounce } from '@/lib/authUtils';

interface UserRole {
  role: 'admin' | 'moderator' | 'user';
  permissions?: string[];
}

export const useRoleBasedNavigation = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isImpersonating } = useImpersonation();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Debounced role fetcher to prevent excessive calls
  const debouncedFetchUserRole = debounce(async (userId: string) => {
    try {
      console.log('🔍 Verificando role do usuário:', userId);

      // Use rate limiting for role fetching
      const roleResult = await withRateLimit(
        `get_user_role_${userId}`,
        async () => {
          const result = await supabase.rpc('get_user_role', { user_id: userId });
          return result;
        },
        3, // Max 3 calls per minute
        60000
      );

      if (!roleResult) {
        console.warn('Role fetch rate limited, using default');
        setUserRole({ role: 'user' });
        setIsRoleLoading(false);
        return;
      }

      const { data: roleData, error } = roleResult as any;

      if (error) {
        console.error('Erro ao buscar role:', error);
        setUserRole({ role: 'user' });
        setIsRoleLoading(false);
        return;
      }

      console.log('📋 Role encontrado:', roleData);

      // Definir o role baseado no retorno
      const userRole = roleData || 'user';
      let permissions: string[] = [];

      if (userRole === 'admin' || userRole === 'super_admin') {
        // Buscar permissões específicas para admins com rate limiting
        const permissionsResult = await withRateLimit(
          `admin_permissions_${userId}`,
          async () => {
            const result = await supabase
              .from('admin_users')
              .select('permissions')
              .eq('user_id', userId)
              .single();
            return result;
          },
          2, // Max 2 calls per minute
          60000
        );
        
        if (permissionsResult && (permissionsResult as any)?.data) {
          permissions = Array.isArray((permissionsResult as any).data.permissions) 
            ? (permissionsResult as any).data.permissions as string[] 
            : [];
        }
        
        setUserRole({
          role: 'admin', // Mapear super_admin para admin no frontend
          permissions
        });
      } else if (userRole === 'moderator') {
        // Buscar permissões específicas para moderadores com rate limiting
        const permissionsResult = await withRateLimit(
          `moderator_permissions_${userId}`,
          async () => {
            const result = await supabase
              .from('admin_users')
              .select('permissions')
              .eq('user_id', userId)
              .single();
            return result;
          },
          2, // Max 2 calls per minute
          60000
        );
        
        if (permissionsResult && (permissionsResult as any)?.data) {
          permissions = Array.isArray((permissionsResult as any).data.permissions) 
            ? (permissionsResult as any).data.permissions as string[] 
            : [];
        }
        
        setUserRole({
          role: 'moderator',
          permissions
        });
      } else {
        setUserRole({ role: 'user' });
      }

      setIsRoleLoading(false);

    } catch (error) {
      console.error('Erro ao buscar role do usuário:', error);
      setUserRole({ role: 'user' });
      setIsRoleLoading(false);
    }
  }, 1000); // 1 second debounce

  // Buscar role do usuário
  useEffect(() => {
    if (!isAuthenticated || !user || isLoading) {
      setUserRole(null);
      setIsRoleLoading(false);
      return;
    }

    debouncedFetchUserRole(user.id);

    return () => {
      debouncedFetchUserRole.cancel();
    };
  }, [isAuthenticated, user?.id, isLoading]);

  // Redirecionamento automático baseado no role
  const redirectBasedOnRole = (currentUserRole: UserRole, currentPath: string, isImpersonating: boolean = false) => {
    console.log('🧭 Navegação baseada em role:', { 
      userRole: currentUserRole.role, 
      currentPath,
      isImpersonating
    });

    // Se está impersonando, não fazer redirecionamentos automáticos
    if (isImpersonating) {
      console.log('🎭 Impersonação ativa, não redirecionando automaticamente');
      return;
    }

    // Se o usuário está tentando acessar uma área restrita
    if (currentPath.startsWith('/admin') && currentUserRole.role !== 'admin') {
      console.log('❌ Acesso negado ao admin, redirecionando...');
      if (currentUserRole.role === 'moderator') {
        navigate('/moderator', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      return;
    }

    // Se moderador está tentando acessar área de usuário comum (SEM IMPERSONAÇÃO)
    if (currentUserRole.role === 'moderator' && currentPath === '/dashboard' && !isImpersonating) {
      console.log('🔄 Redirecionando moderador para área específica (sem impersonação)...');
      navigate('/moderator', { replace: true });
      return;
    }

    // Se admin está tentando acessar dashboard comum quando deveria ter acesso completo
    if (currentUserRole.role === 'admin' && (currentPath === '/dashboard' || currentPath === '/')) {
      console.log('👑 Admin detectado, permitindo acesso mas sugerindo admin dashboard...');
      // Admins podem acessar qualquer área, não forçamos redirecionamento
    }
  };

  // useEffect para chamar a função de redirecionamento
  useEffect(() => {
    if (isLoading || isRoleLoading || !isAuthenticated || !userRole) {
      return;
    }

    redirectBasedOnRole(userRole, location.pathname, isImpersonating);
  }, [userRole, isRoleLoading, isAuthenticated, isLoading, location.pathname, isImpersonating, navigate]);

  const getDefaultDashboard = () => {
    if (!userRole) return '/dashboard';
    
    switch (userRole.role) {
      case 'admin':
        return '/admin';
      case 'moderator':
        return '/moderator';
      default:
        return '/dashboard';
    }
  };

  const canAccess = (requiredRole: 'admin' | 'moderator' | 'user') => {
    if (!userRole) return false;

    const roleHierarchy = {
      admin: 3,
      moderator: 2,
      user: 1
    };

    // Admin pode acessar tudo, incluindo painel moderador
    if (userRole.role === 'admin') return true;

    return roleHierarchy[userRole.role] >= roleHierarchy[requiredRole];
  };

  return {
    userRole,
    isRoleLoading,
    getDefaultDashboard,
    canAccess,
    isAdmin: userRole?.role === 'admin',
    isModerator: userRole?.role === 'moderator',
    isUser: userRole?.role === 'user'
  };
};