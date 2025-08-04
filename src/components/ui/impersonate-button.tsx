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

  const handleImpersonate = () => {
    startImpersonation({
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      artistic_name: targetUser.artistic_name,
      role: targetRole
    });
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