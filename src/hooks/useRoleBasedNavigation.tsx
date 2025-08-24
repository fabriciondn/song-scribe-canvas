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
  const { isImpersonating, impersonatedUser } = useImpersonation();
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

    // Se está impersonando, BLOQUEAR qualquer redirecionamento automático
    if (isImpersonating) {
      console.log('🎭 IMPERSONAÇÃO ATIVA - Bloqueando redirecionamentos automáticos');
      return;
    }

    // Se o usuário está tentando acessar uma área restrita SEM impersonação
    if (currentPath.startsWith('/admin') && currentUserRole.role !== 'admin') {
      console.log('❌ Acesso negado ao admin, redirecionando...');
      if (currentUserRole.role === 'moderator') {
        navigate('/moderator', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      return;
    }

    // Se moderador tenta acessar dashboard SEM impersonação - redirecionar
    if (currentUserRole.role === 'moderator' && currentPath === '/dashboard' && !isImpersonating) {
      console.log('🔄 Redirecionando moderador para área específica (sem impersonação)...');
      navigate('/moderator', { replace: true });
      return;
    }

    // Se o usuário está em uma área de moderador sem permissão
    if (currentPath.startsWith('/moderator') && !['admin', 'moderator'].includes(currentUserRole.role)) {
      console.log('❌ Acesso negado ao moderador, redirecionando...');
      navigate('/dashboard', { replace: true });
      return;
    }

    // Para outras situações, não fazer redirecionamento automático
    console.log('✅ Navegação permitida sem redirecionamento');
  };

  // useEffect para chamar a função de redirecionamento
  useEffect(() => {
    if (isLoading || isRoleLoading || !isAuthenticated) {
      return;
    }

    // Se estiver impersonando, usar o role do usuário impersonado
    const effectiveRole: UserRole = isImpersonating && impersonatedUser
      ? { role: impersonatedUser.role }
      : userRole || { role: 'user' };

    redirectBasedOnRole(effectiveRole, location.pathname, isImpersonating);
  }, [userRole, isRoleLoading, isAuthenticated, isLoading, location.pathname, isImpersonating, impersonatedUser, navigate]);

  const getDefaultDashboard = () => {
    // Se estiver impersonando, usar o role do usuário impersonado
    const effectiveRole = isImpersonating && impersonatedUser
      ? impersonatedUser.role
      : userRole?.role;
    if (!effectiveRole) return '/dashboard';
    switch (effectiveRole) {
      case 'admin':
        return '/admin';
      case 'moderator':
        return '/moderator';
      default:
        return '/dashboard';
    }
  };

  const canAccess = (requiredRole: 'admin' | 'moderator' | 'user') => {
    // Se estiver impersonando, usar o role do usuário impersonado
    const effectiveRole = isImpersonating && impersonatedUser
      ? impersonatedUser.role
      : userRole?.role;
    if (!effectiveRole) return false;

    const roleHierarchy = {
      admin: 3,
      moderator: 2,
      user: 1
    };

    // Admin pode acessar tudo, incluindo painel moderador
    if (effectiveRole === 'admin') return true;

    return roleHierarchy[effectiveRole] >= roleHierarchy[requiredRole];
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