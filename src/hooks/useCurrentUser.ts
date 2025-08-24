import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/context/ImpersonationContext';

/**
 * Retorna o usuário "atual":
 * - Se estiver impersonando, retorna o usuário impersonado
 * - Caso contrário, retorna o usuário autenticado normalmente
 */
export function useCurrentUser() {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  if (isImpersonating && impersonatedUser) {
    return impersonatedUser;
  }
  return user;
}
