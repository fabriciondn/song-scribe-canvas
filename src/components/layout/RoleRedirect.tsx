import { useEffect } from 'react';
import { useRoleBasedNavigation } from '@/hooks/useRoleBasedNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

export const RoleRedirect = () => {
  const { userRole, isRoleLoading } = useRoleBasedNavigation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated || isRoleLoading || !userRole) {
      return;
    }

    const currentPath = location.pathname;
    
    // Se o usuário está na página inicial e tem role específico, redirecionar
    if (currentPath === '/' || currentPath === '/dashboard') {
      if (userRole.role === 'moderator') {
        console.log('🔄 Redirecionando moderador para painel específico');
        navigate('/moderator', { replace: true });
      } else if (userRole.role === 'admin' && currentPath === '/') {
        console.log('👑 Redirecionando admin para painel administrativo');
        navigate('/admin', { replace: true });
      }
    }
  }, [userRole, isRoleLoading, isAuthenticated, location.pathname, navigate]);

  return null; // Este componente não renderiza nada
};