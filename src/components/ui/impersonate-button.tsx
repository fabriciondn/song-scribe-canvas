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
    
    console.log('🚀 Redirecionando para dashboard como usuário');
    // Usar navigate para evitar travamento
    navigate('/dashboard', { replace: true });
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