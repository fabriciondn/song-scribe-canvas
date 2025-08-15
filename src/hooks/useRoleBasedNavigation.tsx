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

  // Debounced role fetcher otimizado para uma única chamada
  const debouncedFetchUserRole = debounce(async (userId: string) => {
    try {
      console.log('🔍 Verificando role do usuário:', userId);

      // Uma única chamada para buscar role e permissões juntos
      const result = await withRateLimit(
        `user_role_complete_${userId}`,
        async () => {
          // Tenta buscar dados de admin primeiro
          const adminResult = await supabase
            .from('admin_users')
            .select('role, permissions')
            .eq('user_id', userId)
            .maybeSingle(); // maybeSingle não dá erro se não encontrar

          return adminResult;
        },
        15, // Max 15 calls por janela
        120000 // 2 minutos
      );

      if (!result) {
        console.warn('Role fetch rate limited, usando cache ou default');
        setUserRole({ role: 'user' });
        setIsRoleLoading(false);
        return;
      }

      const { data: adminData, error } = result as any;

      let role = 'user';
      let permissions: string[] = [];

      if (adminData && !error) {
        // Usuário tem entrada na tabela admin_users
        role = adminData.role || 'user';
        permissions = Array.isArray(adminData.permissions) 
          ? adminData.permissions 
          : (typeof adminData.permissions === 'string' 
             ? JSON.parse(adminData.permissions || '[]')
             : []);
      } else if (!error) {
        // Não há erro mas também não encontrou dados = usuário comum
        role = 'user';
      } else {
        console.warn('Erro ao buscar dados de admin, assumindo usuário comum:', error);
        role = 'user';
      }

      console.log('👤 Role encontrado:', role, 'Permissões:', permissions);

      // Mapear role para o formato esperado pelo frontend
      const mappedRole = role === 'super_admin' ? 'admin' : role as ('admin' | 'moderator' | 'user');

      setUserRole({ 
        role: mappedRole, 
        permissions 
      });

      setIsRoleLoading(false);

    } catch (error) {
      console.error('Erro ao buscar role do usuário:', error);
      setUserRole({ role: 'user' });
      setIsRoleLoading(false);
    }
  }, 500); // Reduzido para 500ms

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
    
    // Se está impersonando, permitir acesso ao dashboard mesmo sendo moderador
    if (isImpersonating && currentPath.startsWith('/dashboard')) {
      console.log('🎭 Impersonação ativa - permitindo acesso ao dashboard');
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