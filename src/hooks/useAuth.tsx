
import { useContext, useEffect, useMemo } from 'react';
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

  // Memoizar o user ID para evitar re-renders desnecessários
  const userId = useMemo(() => context.user?.id, [context.user?.id]);

  // Registrar login quando o usuário se autentica (desabilitado temporariamente)
  useEffect(() => {
    if (userId) {
      console.log('🔍 Usuário autenticado:', userId);
      // logUserActivity('user_session_active'); // Desabilitado para evitar lentidão
    }
  }, [userId]);

  // Memoizar dados de impersonação para evitar re-renders desnecessários
  const impersonatedUserData = useMemo(() => {
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
    return null;
  }, [isImpersonating, impersonatedUser, context]);

  // Se está impersonando, retornar dados do usuário impersonado
  if (impersonatedUserData) {
    return impersonatedUserData;
  }

  return context;
};
