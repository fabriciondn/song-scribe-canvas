import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';
import { useImpersonation } from '@/context/ImpersonationContext';
import { useNavigate } from 'react-router-dom';

interface ImpersonateButtonProps {
  targetUser: {
    id: string;
    name: string | null;
    email: string | null;
    artistic_name: string | null;
  };
  targetRole: 'user' | 'moderator';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default';
  className?: string;
}

export const ImpersonateButton = ({ 
  targetUser, 
  targetRole, 
  variant = 'outline', 
  size = 'sm',
  className = '' 
}: ImpersonateButtonProps) => {
  const { startImpersonation, canImpersonate } = useImpersonation();
  const navigate = useNavigate();

  // Novo: passar id do usuário alvo para checagem
  if (!canImpersonate(targetRole, targetUser.id)) {
    return null;
  }

  const handleImpersonate = async () => {
    console.log('🔘 Botão impersonar clicado:', targetUser);
    // Debug extra: mostrar managedUserIds e targetUser.id
    if (window && window.__IMP_DEBUG__ !== false) {
      try {
        // @ts-ignore
        const ctx = require('@/context/ImpersonationContext');
        // @ts-ignore
        const managedUserIds = ctx?.useImpersonation?.()?.managedUserIds;
        console.log('🟢 managedUserIds:', managedUserIds, 'targetUser.id:', targetUser.id);
      } catch (e) {
        // ignore
      }
    }
    try {
      await startImpersonation({
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        artistic_name: targetUser.artistic_name,
        role: targetRole
      });
      
      console.log('🚀 Aguardando 500ms antes de redirecionar...');
      // Aguardar um pouco para garantir que o contexto seja atualizado
      setTimeout(() => {
        console.log('🚀 Redirecionando para dashboard do usuário comum');
        navigate('/dashboard', { replace: true });
      }, 500);
      
    } catch (error) {
      console.error('❌ Erro ao impersonar:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleImpersonate}
      className={`flex items-center space-x-1 ${className}`}
    >
      <UserCheck className="h-4 w-4" />
      <span>Operar como</span>
    </Button>
  );
};