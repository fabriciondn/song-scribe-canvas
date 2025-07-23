import React from 'react';
import { Header } from './Header';
import { MobileNavigation } from './MobileNavigation';
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
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header fixo */}
      <Header toggleSidebar={toggleSidebar} />
      
      {/* Conteúdo principal com scroll */}
      <main className="flex-1 overflow-y-auto pb-16">
        <div className="safe-area-inset">
          {children}
        </div>
      </main>
      
      {/* Navegação inferior */}
      <MobileNavigation />
    </div>
  );
};