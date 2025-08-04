import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserX, User, Crown, Shield } from 'lucide-react';
import { useImpersonation } from '@/context/ImpersonationContext';

export const ImpersonationBanner = () => {
  const { isImpersonating, impersonatedUser, originalUser, stopImpersonation } = useImpersonation();

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
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-warning/20">
                {impersonatedUser.name?.charAt(0)?.toUpperCase() || 
                 impersonatedUser.email?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  Você está operando como: {impersonatedUser.name || impersonatedUser.email}
                </span>
                <Badge variant={getRoleBadgeVariant(impersonatedUser.role)} className="text-xs">
                  {getRoleIcon(impersonatedUser.role)}
                  {impersonatedUser.role === 'moderator' ? 'Moderador' : 'Usuário'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Usuário original: {originalUser.name || originalUser.email}
                <Badge variant="outline" className="ml-2 text-xs">
                  {getRoleIcon(originalUser.role)}
                  {originalUser.role === 'moderator' ? 'Moderador' : 'Usuário'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={stopImpersonation}
          className="flex items-center space-x-2"
        >
          <UserX className="h-4 w-4" />
          <span>Sair da Impersonação</span>
        </Button>
      </CardContent>
    </Card>
  );
};