import React from 'react';
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

  // Definir altura do banner via CSS custom property
  const bannerHeight = '60px';
  
  React.useEffect(() => {
    document.documentElement.style.setProperty('--impersonation-banner-height', bannerHeight);
    
    return () => {
      document.documentElement.style.removeProperty('--impersonation-banner-height');
    };
  }, [bannerHeight]);

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[9999] bg-warning/95 backdrop-blur-sm border-b border-warning shadow-lg"
      style={{ height: bannerHeight }}
    >
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full gap-4">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-warning-foreground/20 text-warning-foreground">
                  {impersonatedUser.name?.charAt(0)?.toUpperCase() || 
                   impersonatedUser.email?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="font-medium text-warning-foreground truncate text-sm">
                    Operando para o cliente: {impersonatedUser.name || impersonatedUser.email}
                  </span>
                  <Badge variant="outline" className="text-xs border-warning-foreground/30 text-warning-foreground flex-shrink-0">
                    {getRoleIcon(impersonatedUser.role)}
                    Cliente
                  </Badge>
                </div>
                <div className="text-xs text-warning-foreground/70 truncate">
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
              // Verificar se o usuário original é admin ou moderador
              const currentUrl = window.location.pathname;
              if (originalUser?.role === 'admin' || currentUrl.includes('/admin')) {
                window.location.href = '/admin';
              } else {
                window.location.href = '/moderator';
              }
            }}
            className="flex items-center space-x-2 border-warning-foreground/30 text-warning-foreground hover:bg-warning-foreground/10 flex-shrink-0"
          >
            <UserX className="h-4 w-4" />
            <span className="hidden sm:inline">
              Voltar para {originalUser?.role === 'admin' ? 'Admin' : 'Moderação'}
            </span>
            <span className="sm:hidden">Voltar</span>
          </Button>
        </div>
      </div>
    </div>
  );
};