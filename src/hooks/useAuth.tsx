
import { useContext, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { logUserActivity } from '@/services/userActivityService';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Registrar login quando o usuário se autentica
  useEffect(() => {
    if (context.user) {
      logUserActivity('user_session_active');
    }
  }, [context.user]);

  return context;
};
