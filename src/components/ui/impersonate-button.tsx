import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';
import { useImpersonation } from '@/context/ImpersonationContext';

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

  if (!canImpersonate(targetRole)) {
    return null;
  }

  const handleImpersonate = async () => {
    console.log('🔘 Botão impersonar clicado:', targetUser);
    
    await startImpersonation({
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      artistic_name: targetUser.artistic_name,
      role: targetRole
    });
    
    console.log('🚀 Abrindo nova aba para operar como usuário');
    // Abrir em nova aba para melhor funcionamento
    const newWindow = window.open('/dashboard', '_blank');
    if (newWindow) {
      newWindow.focus();
    } else {
      // Fallback se popup foi bloqueado
      window.open('/dashboard', '_blank');
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