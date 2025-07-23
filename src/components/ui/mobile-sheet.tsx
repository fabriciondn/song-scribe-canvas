import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useMobileDetection } from '@/hooks/use-mobile';

interface MobileSheetProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const MobileSheet: React.FC<MobileSheetProps> = ({ 
  trigger, 
  children, 
  title,
  side = 'bottom'
}) => {
  const { isMobile } = useMobileDetection();
  
  if (!isMobile) {
    return <>{trigger}</>;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent 
        side={side} 
        className="h-[80vh] sm:max-w-none pt-10 safe-area-bottom"
      >
        <div className="p-2 max-h-[70vh] overflow-auto">
          {title && <h3 className="text-lg font-medium mb-3">{title}</h3>}
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};