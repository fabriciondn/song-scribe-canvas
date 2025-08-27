
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
  targetRole: 'user' | 'moderator' | 'admin';
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

  if (!canImpersonate(targetRole, targetUser.id)) {
    return null;
  }

  const handleImpersonate = async () => {
    console.log('🔘 Botão impersonar clicado:', { targetUser, targetRole });
    
    try {
      await startImpersonation({
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        artistic_name: targetUser.artistic_name,
        role: targetRole
      });
      
      console.log('🚀 Aguardando 500ms antes de redirecionar...');
      
      // Navegação inteligente baseada no role do usuário impersonado
      setTimeout(() => {
        switch (targetRole) {
          case 'admin':
            console.log('🚀 Redirecionando para dashboard do admin');
            navigate('/admin', { replace: true });
            break;
          case 'moderator':
            console.log('🚀 Redirecionando para dashboard do moderador');
            navigate('/moderator', { replace: true });
            break;
          case 'user':
          default:
            console.log('🚀 Redirecionando para dashboard do usuário comum');
            navigate('/dashboard', { replace: true });
            break;
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Erro ao impersonar:', error);
    }
  };

  const getRoleLabel = () => {
    switch (targetRole) {
      case 'admin':
        return 'Operar como Admin';
      case 'moderator':
        return 'Operar como Moderador';
      case 'user':
      default:
        return 'Operar como';
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
      <span>{getRoleLabel()}</span>
    </Button>
  );
};
