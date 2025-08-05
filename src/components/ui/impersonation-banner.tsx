import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserX, User, Crown, Shield } from 'lucide-react';
import { useImpersonation } from '@/context/ImpersonationContext';
import { useImpersonationSync } from '@/hooks/useImpersonationSync';

export const ImpersonationBanner = () => {
  const { isImpersonating, impersonatedUser, originalUser } = useImpersonation();
  const { stopImpersonationGlobally } = useImpersonationSync();

  if (!isImpersonating || !impersonatedUser || !originalUser) {
    return null;
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'moderator':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="border-warning bg-warning/10 mb-4">
      <CardContent className="flex items-center justify-between p-4 gap-4">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-warning/20">
                {impersonatedUser.name?.charAt(0)?.toUpperCase() || 
                 impersonatedUser.email?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-medium text-warning-foreground truncate">
                  Operando para o cliente: {impersonatedUser.name || impersonatedUser.email}
                </span>
                <Badge variant="outline" className="text-xs border-warning text-warning-foreground flex-shrink-0">
                  {getRoleIcon(impersonatedUser.role)}
                  Cliente
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                Moderador: {originalUser.name || originalUser.email}
              </div>
            </div>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            stopImpersonationGlobally();
            window.location.href = '/moderator';
          }}
          className="flex items-center space-x-2 border-warning text-warning-foreground hover:bg-warning/20 flex-shrink-0 ml-auto"
        >
          <UserX className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar para Moderação</span>
          <span className="sm:hidden">Voltar</span>
        </Button>
      </CardContent>
    </Card>
  );
};