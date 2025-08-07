import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const UpdateNotification = () => {
  const { needsUpdate, updateApp } = usePWA();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (needsUpdate) {
      setShowNotification(true);
    }
  }, [needsUpdate]);

  const handleUpdate = async () => {
    try {
      await updateApp();
      setShowNotification(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating app:', error);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification || !needsUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="bg-primary text-primary-foreground border-primary-foreground/20">
        <Download className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm">
            Nova versão disponível! Atualize para ter acesso às últimas funcionalidades.
          </span>
          <div className="flex gap-2 ml-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleUpdate}
              className="h-7 px-2 text-xs"
            >
              Atualizar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-7 w-7 p-0 text-primary-foreground/70 hover:text-primary-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};