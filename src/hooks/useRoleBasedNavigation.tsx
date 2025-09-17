
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/context/ImpersonationContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useAffiliateRole } from '@/hooks/useAffiliateRole';

export const useRoleBasedNavigation = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const userRoleData = useUserRole();
  const { isAffiliate, isLoading: affiliateLoading } = useAffiliateRole();
  const navigate = useNavigate();
  const location = useLocation();

  // Usar dados do hook unificado
  const userRole = useMemo(() => {
    if (isImpersonating && impersonatedUser) {
      return {
        role: impersonatedUser.role as 'admin' | 'moderator' | 'affiliate' | 'user',
        permissions: []
      };
    }
    
    // Determinar role baseado nos hooks
    let role: 'admin' | 'moderator' | 'affiliate' | 'user' = 'user';
    if (userRoleData.isAdmin) role = 'admin';
    else if (userRoleData.isModerator) role = 'moderator';
    else if (isAffiliate) role = 'affiliate';
    
    return {
      role,
      permissions: []
    };
  }, [isImpersonating, impersonatedUser, userRoleData.role, userRoleData.isAdmin, userRoleData.isModerator, isAffiliate]);

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

    // CRÍTICO: Se está no painel admin/moderator/affiliate, NÃO redirecionar
    if (currentPath.startsWith('/admin') || currentPath.startsWith('/moderator') || currentPath.startsWith('/affiliate')) {
      console.log('🛡️ NO PAINEL ADMIN/MODERATOR/AFFILIATE - Mantendo usuário na página');
      return;
    }

    // CRÍTICO: Remover redirecionamentos automáticos que causam loops
    // Usuários devem poder navegar livremente entre dashboards
    console.log('✅ Permitindo navegação livre entre dashboards');

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

    if (currentPath.startsWith('/affiliate') && !['admin', 'moderator', 'affiliate'].includes(currentUserRole.role)) {
      console.log('❌ Acesso negado ao afiliado');
      navigate('/dashboard', { replace: true });
      return;
    }

    console.log('✅ Navegação permitida');
  };

  // useEffect para verificações de segurança e redirecionamentos
  useEffect(() => {
    if (isLoading || userRoleData.isLoading || affiliateLoading || !isAuthenticated) {
      return;
    }

    redirectBasedOnRole(userRole, location.pathname);
  }, [userRole, userRoleData.isLoading, affiliateLoading, isAuthenticated, isLoading, location.pathname, isImpersonating, navigate]);

  const getDefaultDashboard = () => {
    const effectiveRole = isImpersonating && impersonatedUser
      ? impersonatedUser.role
      : userRole.role;
      
    switch (effectiveRole) {
      case 'admin':
        return '/admin';
      case 'moderator':
        return '/moderator';
      case 'affiliate':
        return '/affiliate';
      default:
        return '/dashboard';
    }
  };

  const canAccess = (requiredRole: 'admin' | 'moderator' | 'affiliate' | 'user') => {
    const effectiveRole = isImpersonating && impersonatedUser
      ? impersonatedUser.role
      : userRole.role;
      
    if (!effectiveRole) return false;

    const roleHierarchy = {
      admin: 4,
      moderator: 3,
      affiliate: 2,
      user: 1
    };

    return roleHierarchy[effectiveRole] >= roleHierarchy[requiredRole];
  };

  return {
    userRole,
    isRoleLoading: userRoleData.isLoading || affiliateLoading,
    getDefaultDashboard,
    canAccess,
    isAdmin: userRoleData.isAdmin,
    isModerator: userRoleData.isModerator,
    isAffiliate: userRole.role === 'affiliate',
    isUser: userRole.role === 'user'
  };
};
