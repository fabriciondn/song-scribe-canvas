
import { useContext, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useImpersonation } from '@/context/ImpersonationContext';
import { logUserActivity } from '@/services/userActivityService';

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { isImpersonating, impersonatedUser } = useImpersonation();
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Registrar login quando o usuário se autentica
  useEffect(() => {
    if (context.user) {
      logUserActivity('user_session_active');
    }
  }, [context.user]);

  // Se está impersonando, retornar dados do usuário impersonado
  if (isImpersonating && impersonatedUser) {
    return {
      ...context,
      user: {
        id: impersonatedUser.id,
        email: impersonatedUser.email || '',
        app_metadata: {},
        user_metadata: {
          name: impersonatedUser.name,
          artistic_name: impersonatedUser.artistic_name
        },
        aud: '',
        created_at: '',
        role: impersonatedUser.role
      }
    };
  }

  return context;
};
