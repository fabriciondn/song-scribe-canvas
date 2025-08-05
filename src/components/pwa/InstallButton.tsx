import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

interface InstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const InstallButton: React.FC<InstallButtonProps> = ({
  variant = 'default',
  size = 'default',
  className
}) => {
  const { isInstallable, installApp, isMobile } = usePWA();

  const handleInstall = async () => {
    const success = await installApp();
    
    if (success) {
      toast.success('App instalado com sucesso!');
    } else {
      // Fallback para iOS
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        toast.info(
          'Para instalar: toque no botão "Compartilhar" (□) e selecione "Adicionar à Tela Inicial"',
          { duration: 6000 }
        );
      } else {
        toast.error('Não foi possível instalar o app');
      }
    }
  };

  // Só mostra o botão se for mobile e for instalável
  if (!isMobile || !isInstallable) return null;

  return (
    <Button
      onClick={handleInstall}
      variant={variant}
      size={size}
      className={className}
    >
      <Download className="w-4 h-4 mr-2" />
      Instalar App
    </Button>
  );
};