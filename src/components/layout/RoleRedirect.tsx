
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useImpersonation } from '@/context/ImpersonationContext';
import { useUserRole } from '@/hooks/useUserRole'; // Hook unificado

export const RoleRedirect = () => {
  const { isAuthenticated } = useAuth();
  const { isImpersonating } = useImpersonation();
  const { role, isLoading } = useUserRole(); // Usar hook unificado
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      return;
    }

    // Se está impersonando, não redirecionar automaticamente
    if (isImpersonating) {
      console.log('🎭 Impersonação ativa - sem redirecionamento automático');
      return;
    }

    const currentPath = location.pathname;
    
    // CRÍTICO: NÃO redirecionar se estiver no admin ou moderator
    if (currentPath.startsWith('/admin') || currentPath.startsWith('/moderator')) {
      console.log('🛡️ Usuário no painel admin/moderator - não redirecionando');
      return;
    }
    
    // Redirecionamento apenas da página inicial "/"
    if (currentPath === '/') {
      if (role === 'admin') {
        console.log('👑 Redirecionando admin para painel administrativo');
        navigate('/admin', { replace: true });
      } else if (role === 'moderator') {
        console.log('🔄 Redirecionando moderador para painel específico');
        navigate('/moderator', { replace: true });
      }
    }
  }, [role, isLoading, isAuthenticated, isImpersonating, location.pathname, navigate]);

  return null;
};
