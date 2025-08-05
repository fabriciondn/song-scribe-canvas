import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useMobileDetection } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAManager: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [updateWaiting, setUpdateWaiting] = useState<ServiceWorker | null>(null);
  const { isMobile } = useMobileDetection();

  useEffect(() => {
    // Só funciona no mobile
    if (!isMobile) return;

    // Detecta se já está instalado
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkIfInstalled();

    // Escuta evento de instalação disponível
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const beforeInstallPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(beforeInstallPrompt);
      
      // Mostrar prompt após um delay para melhor UX
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true);
        }
      }, 3000);
    };

    // Escuta quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      toast.success('App instalado com sucesso!');
    };

    // Service Worker para updates
    const handleServiceWorkerUpdate = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

        navigator.serviceWorker.ready.then(registration => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setNeedsUpdate(true);
                  setUpdateWaiting(newWorker);
                }
              });
            }
          });
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    handleServiceWorkerUpdate();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isMobile, isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback para iOS
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        toast.info('Para instalar: toque no botão "Compartilhar" e selecione "Adicionar à Tela Inicial"');
        return;
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        toast.success('Instalação iniciada!');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Erro na instalação:', error);
      toast.error('Erro ao tentar instalar o app');
    }
  };

  const handleUpdateClick = () => {
    if (updateWaiting) {
      updateWaiting.postMessage({ type: 'SKIP_WAITING' });
      setNeedsUpdate(false);
      toast.success('Atualizando app...');
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
  };

  // Não renderizar nada se não for mobile
  if (!isMobile) return null;

  return (
    <>
      {/* Prompt de Instalação */}
      {showInstallPrompt && !isInstalled && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-4">
          <Card className="w-full max-w-sm bg-background border-primary/20 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <CardHeader className="relative pb-3">
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                onClick={dismissInstallPrompt}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Instalar Compuse</CardTitle>
                  <CardDescription className="text-sm">
                    Tenha acesso rápido ao app direto da tela inicial
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p>✨ Acesso instantâneo</p>
                  <p>📱 Experiência nativa</p>
                  <p>🚀 Funciona offline</p>
                </div>
                <Button 
                  onClick={handleInstallClick}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Download className="h-4 w-4" />
                  Instalar App
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prompt de Update */}
      {needsUpdate && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <Card className="bg-primary text-primary-foreground border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-sm font-medium">Nova versão disponível!</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUpdateClick}
                  className="bg-white text-primary hover:bg-white/90"
                >
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};