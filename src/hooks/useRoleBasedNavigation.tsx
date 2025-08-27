
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/context/ImpersonationContext';
import { useUserRole } from '@/hooks/useUserRole';

export const useRoleBasedNavigation = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const userRoleData = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  // Usar dados do hook unificado
  const userRole = useMemo(() => {
    if (isImpersonating && impersonatedUser) {
      return {
        role: impersonatedUser.role as 'admin' | 'moderator' | 'user',
        permissions: []
      };
    }
    return {
      role: userRoleData.role,
      permissions: []
    };
  }, [isImpersonating, impersonatedUser, userRoleData.role]);

  // Função simplificada de redirecionamento - SEM redirecionamentos automáticos problemáticos
  const redirectBasedOnRole = (currentUserRole: typeof userRole, currentPath: string) => {
    console.log('🧭 useRoleBasedNavigation: Verificando navegação:', { 
      userRole: currentUserRole.role, 
      currentPath,
      isImpersonating
    });

    // CRÍTICO: Se está impersonando, BLOQUEAR qualquer redirecionamento automático
    if (isImpersonating) {
      console.log('🎭 IMPERSONAÇÃO ATIVA - Bloqueando redirecionamentos');
      return;
    }

    // CRÍTICO: Se está no painel admin/moderator, NÃO redirecionar
    if (currentPath.startsWith('/admin') || currentPath.startsWith('/moderator')) {
      console.log('🛡️ NO PAINEL ADMIN/MODERATOR - Mantendo usuário na página');
      return;
    }

    // Apenas verificações de segurança - usuário tentando acessar área sem permissão
    if (currentPath.startsWith('/admin') && currentUserRole.role !== 'admin') {
      console.log('❌ Acesso negado ao admin');
      navigate('/dashboard', { replace: true });
      return;
    }

    if (currentPath.startsWith('/moderator') && !['admin', 'moderator'].includes(currentUserRole.role)) {
      console.log('❌ Acesso negado ao moderador');
      navigate('/dashboard', { replace: true });
      return;
    }

    console.log('✅ Navegação permitida');
  };

  // useEffect para verificações de segurança - SEM redirecionamentos automáticos
  useEffect(() => {
    if (isLoading || userRoleData.isLoading || !isAuthenticated) {
      return;
    }

    // Apenas verificações de segurança, sem redirecionamentos automáticos
    redirectBasedOnRole(userRole, location.pathname);
  }, [userRole, userRoleData.isLoading, isAuthenticated, isLoading, location.pathname, isImpersonating, navigate]);

  const getDefaultDashboard = () => {
    const effectiveRole = isImpersonating && impersonatedUser
      ? impersonatedUser.role
      : userRoleData.role;
      
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
    const effectiveRole = isImpersonating && impersonatedUser
      ? impersonatedUser.role
      : userRoleData.role;
      
    if (!effectiveRole) return false;

    const roleHierarchy = {
      admin: 3,
      moderator: 2,
      user: 1
    };

    return roleHierarchy[effectiveRole] >= roleHierarchy[requiredRole];
  };

  return {
    userRole,
    isRoleLoading: userRoleData.isLoading,
    getDefaultDashboard,
    canAccess,
    isAdmin: userRoleData.isAdmin,
    isModerator: userRoleData.isModerator,
    isUser: userRoleData.role === 'user'
  };
};
