import { useEffect } from 'react';
import { useImpersonation } from '@/context/ImpersonationContext';

export const useImpersonationSync = () => {
  const { startImpersonation, stopImpersonation, isImpersonating } = useImpersonation();

  // Sincronizar estado de impersonação via localStorage
  useEffect(() => {
    const syncImpersonation = () => {
      const storedImpersonation = localStorage.getItem('impersonation_data');
      
      if (storedImpersonation && !isImpersonating) {
        try {
          const impersonationData = JSON.parse(storedImpersonation);
          console.log('🔄 Sincronizando impersonação entre abas:', impersonationData);
          startImpersonation(impersonationData);
        } catch (error) {
          console.error('Erro ao sincronizar impersonação:', error);
          localStorage.removeItem('impersonation_data');
        }
      }
    };

    // Executar na inicialização
    syncImpersonation();

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'impersonation_data') {
        syncImpersonation();
      } else if (e.key === 'stop_impersonation') {
        stopImpersonation();
        localStorage.removeItem('stop_impersonation');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [startImpersonation, stopImpersonation, isImpersonating]);

  return {
    // Função para parar impersonação em todas as abas
    stopImpersonationGlobally: () => {
      localStorage.removeItem('impersonation_data');
      localStorage.setItem('stop_impersonation', Date.now().toString());
      stopImpersonation();
    }
  };
};