
import { useState, useEffect } from 'react';

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Função para verificar se é um dispositivo móvel
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar no carregamento inicial
    checkMobile();

    // Adicionar listener para redimensionamento da janela
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}
