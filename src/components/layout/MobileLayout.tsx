import React from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileNavigation } from './MobileNavigation';
import { PWAManager } from '@/components/pwa/PWAManager';
import { useMobileDetection } from '@/hooks/use-mobile';

interface MobileLayoutProps {
  children: React.ReactNode;
  toggleSidebar: () => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  toggleSidebar 
}) => {
  const { isMobile } = useMobileDetection();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden touch-manipulation">
      {/* Header móvel otimizado */}
      <MobileHeader toggleSidebar={toggleSidebar} />
      
      {/* Conteúdo principal com scroll otimizado */}
      <main className="flex-1 overflow-y-auto pb-16 overscroll-contain">
        <div className="safe-area-inset px-4 py-2">
          {children}
        </div>
      </main>
      
      {/* Navegação inferior */}
      <MobileNavigation />
      
      {/* PWA Manager */}
      <PWAManager />
    </div>
  );
};