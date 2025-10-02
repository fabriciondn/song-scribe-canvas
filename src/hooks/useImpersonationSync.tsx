
import { useEffect, useContext } from 'react';
import { ImpersonationContext } from '@/context/ImpersonationContext';

export const useImpersonationSync = () => {
  // Usar contexto de forma segura (pode não existir em algumas rotas)
  const impersonationContext = useContext(ImpersonationContext);
  
  // Se o contexto não existir, retornar função vazia
  if (!impersonationContext) {
    return {
      stopImpersonationGlobally: () => {}
    };
  }
  
  const { startImpersonation, stopImpersonation, isImpersonating } = impersonationContext;

  // Sincronizar estado de impersonação via localStorage
  useEffect(() => {
    const syncImpersonation = () => {
      try {
        const storedImpersonation = localStorage.getItem('impersonation_data');
        
        if (storedImpersonation && !isImpersonating) {
          const impersonationData = JSON.parse(storedImpersonation);
          console.log('🔄 Sincronizando impersonação entre abas:', impersonationData);
          
          // Se os dados têm a estrutura nova com targetUser e originalUser
          if (impersonationData.targetUser) {
            startImpersonation(impersonationData.targetUser);
          } else {
            // Compatibilidade com formato antigo
            startImpersonation(impersonationData);
          }
        }
      } catch (error) {
        console.error('Erro ao sincronizar impersonação:', error);
        localStorage.removeItem('impersonation_data');
      }
    };

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'impersonation_data') {
        syncImpersonation();
      } else if (e.key === 'stop_impersonation') {
        stopImpersonation();
        localStorage.removeItem('stop_impersonation');
      }
    };

    // Executar na inicialização apenas se necessário
    syncImpersonation();

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
