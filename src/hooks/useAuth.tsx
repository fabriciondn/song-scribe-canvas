
import { useContext, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { ImpersonationContext } from '@/context/ImpersonationContext';
import { logUserActivity } from '@/services/userActivityService';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Tentar usar impersonação de forma segura
  const impersonationContext = useContext(ImpersonationContext);
  const isImpersonating = impersonationContext?.isImpersonating || false;
  const impersonatedUser = impersonationContext?.impersonatedUser;
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Registrar login quando o usuário se autentica (desabilitado temporariamente)
  useEffect(() => {
    if (context.user) {
      console.log('🔍 Usuário autenticado:', context.user.id);
      // logUserActivity('user_session_active'); // Desabilitado para evitar lentidão
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
          artistic_name: impersonatedUser.artistic_name,
          avatar_url: ''
        },
        aud: '',
        created_at: '',
        role: impersonatedUser.role
      }
    };
  }

  return context;
};
