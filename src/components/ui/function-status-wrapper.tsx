import React from 'react';
import { useFunctionStatus } from '@/hooks/useMenuFunctions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Construction, TestTube, Info } from 'lucide-react';

interface FunctionStatusWrapperProps {
  functionKey: string;
  children: React.ReactNode;
  showBadge?: boolean;
}

export function FunctionStatusWrapper({ 
  functionKey, 
  children, 
  showBadge = false 
}: FunctionStatusWrapperProps) {
  const { status, loading } = useFunctionStatus(functionKey);

  if (loading) {
    return <>{children}</>;
  }

  // Se a função está em "coming soon", mostrar mensagem ao invés do conteúdo
  if (status === 'coming_soon') {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Construction className="h-16 w-16 mx-auto text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Função em Desenvolvimento</h3>
            <p className="text-muted-foreground max-w-md">
              Esta funcionalidade está sendo desenvolvida e estará disponível em breve. 
              Acompanhe as atualizações!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se a função está em beta, mostrar o conteúdo com aviso
  if (status === 'beta') {
    return (
      <div className="space-y-4">
        {showBadge && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <TestTube className="h-3 w-3" />
              <span>Beta</span>
            </Badge>
          </div>
        )}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta funcionalidade está em fase beta. Algumas características podem estar 
            incompletas ou sofrer alterações.
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // Se está disponível, mostrar normalmente
  return <>{children}</>;
}

// Componente para mostrar apenas o badge de status
export function FunctionStatusBadge({ functionKey }: { functionKey: string }) {
  const { status, loading } = useFunctionStatus(functionKey);

  if (loading || status === 'available') {
    return null;
  }

  const getBadgeContent = () => {
    switch (status) {
      case 'beta':
        return {
          variant: 'secondary' as const,
          icon: <TestTube className="h-3 w-3" />,
          text: 'Beta'
        };
      case 'coming_soon':
        return {
          variant: 'destructive' as const,
          icon: <Construction className="h-3 w-3" />,
          text: 'Em Breve'
        };
      default:
        return null;
    }
  };

  const badgeContent = getBadgeContent();
  
  if (!badgeContent) return null;

  return (
    <Badge variant={badgeContent.variant} className="flex items-center space-x-1">
      {badgeContent.icon}
      <span>{badgeContent.text}</span>
    </Badge>
  );
}