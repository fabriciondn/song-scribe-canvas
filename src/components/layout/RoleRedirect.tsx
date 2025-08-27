
import { useEffect } from 'react';
import { useRoleBasedNavigation } from '@/hooks/useRoleBasedNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useImpersonation } from '@/context/ImpersonationContext';
import { useRegionalAuth } from '@/hooks/useRegionalAuth';

export const RoleRedirect = () => {
  const { userRole, isRoleLoading } = useRoleBasedNavigation();
  const { isAuthenticated } = useAuth();
  const { isImpersonating } = useImpersonation();
  const { reportAuthIssue } = useRegionalAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated || isRoleLoading || !userRole) {
      return;
    }

    // Se está impersonando, não redirecionar automaticamente
    if (isImpersonating) {
      return;
    }

    const currentPath = location.pathname;
    
    // CRÍTICO: NÃO redirecionar se estiver no admin ou moderator
    if (currentPath.startsWith('/admin') || currentPath.startsWith('/moderator')) {
      console.log('🛡️ Usuário no painel admin/moderator - não redirecionando');
      return;
    }
    
    // Se o usuário está na página inicial e tem role específico, redirecionar APENAS da raiz
    if (currentPath === '/') {
      if (userRole.role === 'admin') {
        console.log('👑 Redirecionando admin para painel administrativo');
        navigate('/admin', { replace: true });
      } else if (userRole.role === 'moderator') {
        console.log('🔄 Redirecionando moderador para painel específico');
        navigate('/moderator', { replace: true });
      }
    }
  }, [userRole, isRoleLoading, isAuthenticated, isImpersonating, location.pathname, navigate]);

  return null;
};
