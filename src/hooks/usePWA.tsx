import { useState, useEffect } from 'react';
import { useMobileDetection } from './use-mobile';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const { isMobile } = useMobileDetection();

  useEffect(() => {
    if (!isMobile) return;

    // Verifica se já está instalado
    const checkInstallationStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInstalled = isStandalone || isInWebAppiOS;
      
      setIsInstalled(isInstalled);
      return isInstalled;
    };

    const isCurrentlyInstalled = checkInstallationStatus();

    // Eventos PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const beforeInstallPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(beforeInstallPrompt);
      
      if (!isCurrentlyInstalled) {
        setIsInstallable(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Service Worker para updates com timeout reduzido
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // Verificar updates mais frequentemente
        setInterval(() => {
          registration.update();
        }, 60000); // Verificar a cada minuto

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNeedsUpdate(true);
              }
            });
          }
        });
      });

      // Escutar mensagens do service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SW_UPDATED') {
          setNeedsUpdate(true);
        }
      });
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isMobile]);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Erro na instalação:', error);
      return false;
    }
  };

  const updateApp = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Aguardar um pouco antes de recarregar
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        console.error('Erro ao atualizar app:', error);
        // Forçar reload em caso de erro
        window.location.reload();
      }
    }
  };

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    needsUpdate,
    installApp,
    updateApp,
    isMobile
  };
};