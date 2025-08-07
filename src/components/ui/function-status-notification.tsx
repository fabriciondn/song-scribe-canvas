import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Info, TestTube, Construction } from 'lucide-react';
import { useFunctionStatus } from '@/hooks/useMenuFunctions';
import { useLocation } from 'react-router-dom';

export function FunctionStatusNotification() {
  const location = useLocation();
  const [dismissed, setDismissed] = useState<string[]>([]);
  
  // Mapeamento de rotas para chaves de função
  const routeToFunctionMap: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/composer': 'composer', 
    '/author-registration': 'author-registration',
    '/cifrador': 'cifrador',
    '/bases': 'bases',
    '/folders': 'folders',
    '/drafts': 'drafts',
    '/partnerships': 'partnerships',
    '/tutorials': 'tutorials',
    '/settings': 'settings',
    '/trash': 'trash',
    '/admin': 'admin',
    '/moderator': 'moderator',
  };

  const functionKey = routeToFunctionMap[location.pathname];
  const { status, loading } = useFunctionStatus(functionKey);

  // Resetar dismissals quando mudar de página
  useEffect(() => {
    setDismissed([]);
  }, [location.pathname]);

  const handleDismiss = () => {
    if (functionKey) {
      setDismissed(prev => [...prev, functionKey]);
    }
  };

  // Não mostrar se não há função mapeada, está carregando, é available, ou foi dismissed
  if (!functionKey || loading || status === 'available' || dismissed.includes(functionKey)) {
    return null;
  }

  const getNotificationContent = () => {
    switch (status) {
      case 'beta':
        return {
          icon: <TestTube className="h-4 w-4 text-blue-600" />,
          title: 'Versão Beta',
          description: 'Esta funcionalidade está em fase beta. Algumas características podem estar incompletas.',
          className: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
        };
      case 'coming_soon':
        return {
          icon: <Construction className="h-4 w-4 text-amber-600" />,
          title: 'Em Desenvolvimento',
          description: 'Esta funcionalidade está sendo desenvolvida e estará disponível em breve.',
          className: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
        };
      default:
        return null;
    }
  };

  const content = getNotificationContent();
  if (!content) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className={content.className}>
        {content.icon}
        <AlertDescription className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">{content.title}</div>
            <div className="text-xs mt-1 opacity-90">{content.description}</div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 ml-2"
          >
            <X className="h-3 w-3" />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}