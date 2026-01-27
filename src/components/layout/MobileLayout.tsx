import React, { useState } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNavigation } from '@/components/mobile/MobileBottomNavigation';
import { MobileSidebar } from './MobileSidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!isMobile) {
    return null;
  }

  const handleToolsClick = () => {
    // Verificar se estamos na página do composer e se há uma função disponível
    if ((window as any).editorShowTools) {
      (window as any).editorShowTools();
    } else {
      console.log('Tools clicked - função não disponível');
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col overflow-x-hidden touch-manipulation overscroll-contain" style={{ backgroundColor: '#000000' }}>
      {/* Conteúdo principal com scroll otimizado - sem header no novo design */}
      <main className="flex-1 overflow-y-auto pb-24 overscroll-contain bg-[#000000] will-change-scroll">
        {children}
      </main>
      
      {/* Nova navegação inferior com botão central flutuante */}
      <MobileBottomNavigation onMenuClick={() => setIsMenuOpen(true)} />

      {/* Menu lateral */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="p-0 w-[85vw] max-w-sm bg-[#0A0A0A] border-gray-800">
          <MobileSidebar onClose={() => setIsMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
};