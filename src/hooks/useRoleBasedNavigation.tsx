import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserRole {
  role: 'admin' | 'moderator' | 'user';
  permissions?: string[];
}

export const useRoleBasedNavigation = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Buscar role do usuário
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isAuthenticated || !user) {
        setUserRole(null);
        setIsRoleLoading(false);
        return;
      }

      try {
        console.log('🔍 Verificando role do usuário:', user.id);

        // Usar a nova função para obter o role do usuário
        const { data: roleData, error } = await supabase.rpc('get_user_role', {
          user_id: user.id
        });

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
          // Buscar permissões específicas para admins
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('permissions')
            .eq('user_id', user.id)
            .single();
          
          permissions = Array.isArray(adminData?.permissions) ? adminData.permissions as string[] : [];
          
          setUserRole({
            role: 'admin', // Mapear super_admin para admin no frontend
            permissions
          });
        } else if (userRole === 'moderator') {
          // Buscar permissões específicas para moderadores
          const { data: moderatorData } = await supabase
            .from('admin_users')
            .select('permissions')
            .eq('user_id', user.id)
            .single();
          
          permissions = Array.isArray(moderatorData?.permissions) ? moderatorData.permissions as string[] : [];
          
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
    };

    if (!isLoading) {
      fetchUserRole();
    }
  }, [isAuthenticated, user, isLoading]);

  // Redirecionamento automático baseado no role
  useEffect(() => {
    if (isLoading || isRoleLoading || !isAuthenticated || !userRole) {
      return;
    }

    const currentPath = location.pathname;
    console.log('🧭 Navegação baseada em role:', { 
      userRole: userRole.role, 
      currentPath 
    });

    // Se o usuário está tentando acessar uma área restrita
    if (currentPath.startsWith('/admin') && userRole.role !== 'admin') {
      console.log('❌ Acesso negado ao admin, redirecionando...');
      if (userRole.role === 'moderator') {
        navigate('/moderator', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      return;
    }

    // Se moderador está tentando acessar área de usuário comum
    if (userRole.role === 'moderator' && currentPath === '/dashboard') {
      console.log('🔄 Redirecionando moderador para área específica...');
      navigate('/moderator', { replace: true });
      return;
    }

    // Se admin está tentando acessar dashboard comum quando deveria ter acesso completo
    if (userRole.role === 'admin' && (currentPath === '/dashboard' || currentPath === '/')) {
      console.log('👑 Admin detectado, permitindo acesso mas sugerindo admin dashboard...');
      // Admins podem acessar qualquer área, não forçamos redirecionamento
    }

  }, [userRole, isRoleLoading, isAuthenticated, isLoading, location.pathname, navigate]);

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