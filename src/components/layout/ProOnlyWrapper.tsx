import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';

interface ProOnlyWrapperProps {
  children: React.ReactNode;
  featureName: string;
}

export const ProOnlyWrapper: React.FC<ProOnlyWrapperProps> = ({ 
  children, 
  featureName 
}) => {
  const { isPro, isAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Admins têm acesso total
  if (isAdmin || isPro) {
    return <>{children}</>;
  }

  // Usuários não-Pro veem a mensagem de upgrade
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Recurso Pro
          </CardTitle>
          <CardDescription>
            {featureName} está disponível apenas para usuários Pro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Upgrade para Pro e tenha acesso a todas as funcionalidades avançadas da plataforma.
            </p>
          </div>
          
          <Button size="lg" className="w-full">
            <Crown className="mr-2 h-4 w-4" />
            Fazer Upgrade para Pro
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Entre em contato conosco para mais informações sobre os planos Pro.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};