import React, { useState } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileNavigation } from './MobileNavigation';
import { MobileSidebar } from './MobileSidebar';
import { useMobileDetection } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface MobileLayoutProps {
  children: React.ReactNode;
  toggleSidebar: () => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  toggleSidebar 
}) => {
  const { isMobile } = useMobileDetection();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!isMobile) {
    return null;
  }

  const handleToolsClick = () => {
    if ((window as any).editorShowTools) {
      (window as any).editorShowTools();
    } else {
      console.log('Tools clicked - função não disponível');
    }
  };

  const handleMenuClick = () => {
    setIsMenuOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden touch-manipulation">
      {/* Header móvel compacto */}
      <MobileHeader toggleSidebar={toggleSidebar} />
      
      {/* Conteúdo principal com scroll otimizado */}
      <main className="flex-1 overflow-y-auto overscroll-contain scroll-smooth">
        <div className="pb-20">
          {children}
        </div>
      </main>
      
      {/* Navegação inferior estilo nativo */}
      <MobileNavigation 
        onToolsClick={handleToolsClick} 
        onMenuClick={handleMenuClick}
      />

      {/* Menu lateral (Drawer) */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="right" className="w-[85%] max-w-[320px] p-0">
          <MobileSidebar onClose={() => setIsMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
};
