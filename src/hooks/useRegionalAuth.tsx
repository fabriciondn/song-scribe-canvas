import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { logAuthEvent } from '@/lib/authUtils';

/**
 * Hook para monitorar problemas de autenticação específicos de regiões
 * Focado em identificar issues com usuários do Nordeste/Bahia
 */
export const useRegionalAuth = () => {
  const { user, isAuthenticated, session } = useAuth();

  useEffect(() => {
    if (!user) return;

    const monitorAuthHealth = () => {
      const now = Date.now();
      const sessionKey = `auth_health_${user.id}`;
      const lastCheck = localStorage.getItem(sessionKey);
      
      // Verificar se houve problemas recentes
      if (lastCheck) {
        const timeSinceLastCheck = now - parseInt(lastCheck);
        if (timeSinceLastCheck < 30000) { // 30 segundos
          return; // Evitar verificações muito frequentes
        }
      }

      // Log detalhado para debugging regional
      logAuthEvent('health_check', {
        user_id: user.id,
        session_exists: !!session,
        session_expires_at: session?.expires_at,
        time_to_expire: session?.expires_at ? 
          new Date(session.expires_at * 1000).getTime() - now : null,
        navigator_onLine: navigator.onLine,
        connection_type: (navigator as any)?.connection?.effectiveType,
        user_agent: navigator.userAgent.substring(0, 100)
      });

      localStorage.setItem(sessionKey, now.toString());

      // Verificar se a sessão está próxima do vencimento
      if (session?.expires_at) {
        const expiryTime = session.expires_at * 1000;
        const timeToExpiry = expiryTime - now;
        
        if (timeToExpiry < 300000) { // 5 minutos
          console.warn('⚠️ Sessão próxima do vencimento:', {
            time_to_expiry: timeToExpiry,
            expires_at: new Date(expiryTime).toISOString()
          });
          
          logAuthEvent('session_expiry_warning', {
            user_id: user.id,
            time_to_expiry: timeToExpiry,
            expires_at: session.expires_at
          });
        }
      }
    };

    // Monitor inicial
    monitorAuthHealth();

    // Monitor periódico (a cada 2 minutos)
    const interval = setInterval(monitorAuthHealth, 120000);

    // Monitor de visibilidade da página
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        setTimeout(monitorAuthHealth, 1000); // Delay para evitar race conditions
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, isAuthenticated, session]);

  return {
    // Função para reportar problema específico
    reportAuthIssue: (issueType: string, metadata?: any) => {
      logAuthEvent(`issue_${issueType}`, {
        user_id: user?.id,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        ...metadata
      });
    }
  };
};