import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';

// Componente para Material Symbols
const MaterialIcon: React.FC<{ name: string; filled?: boolean; className?: string }> = ({ 
  name, 
  filled = false, 
  className = '' 
}) => (
  <span 
    className={`material-symbols-rounded ${className}`}
    style={{ 
      fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
    }}
  >
    {name}
  </span>
);

interface MobileBottomNavigationProps {
  onMenuClick?: () => void;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const { isPro } = useSubscription();

  const isActive = (path: string) => location.pathname === path;

  // Hide navigation on composer page for better UX
  const isComposerPage = location.pathname === '/dashboard/composer';
  if (isComposerPage) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-card border-t border-border pb-6 pt-2 px-6 flex justify-between items-center z-50 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Início */}
      <Link
        to="/dashboard"
        className={cn(
          'flex flex-col items-center gap-1 p-2 transition-colors',
          isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <MaterialIcon name="home" filled={isActive('/dashboard')} />
        <span className="text-[10px] font-medium">Início</span>
      </Link>

      {/* Certificados */}
      <Link
        to="/dashboard/registered-works"
        className={cn(
          'flex flex-col items-center gap-1 p-2 transition-colors',
          isActive('/dashboard/registered-works') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <MaterialIcon name="workspace_premium" filled={isActive('/dashboard/registered-works')} />
        <span className="text-[10px] font-medium">Certificados</span>
      </Link>

      {/* Botão central - Compor */}
      <div className="relative -top-6 flex flex-col items-center group">
        <Link
          to="/dashboard/composer"
          className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/40 hover:scale-105 active:scale-95 transition-transform border-4 border-background"
        >
          <MaterialIcon name="history_edu" className="text-3xl" />
        </Link>
        <span className="text-[10px] font-medium text-muted-foreground mt-1 group-hover:text-primary transition-colors">Compor</span>
      </div>

      {/* Pendrive */}
      <Link
        to="/dashboard/pendrive"
        className={cn(
          'flex flex-col items-center gap-1 p-2 transition-colors',
          isActive('/dashboard/pendrive') || isActive('/pendrive') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <MaterialIcon name="usb" filled={isActive('/dashboard/pendrive') || isActive('/pendrive')} />
        <span className="text-[10px] font-medium">Pendrive</span>
      </Link>

      {/* Menu */}
      <button
        onClick={onMenuClick}
        className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <MaterialIcon name="menu" />
        <span className="text-[10px] font-medium">Menu</span>
      </button>
    </nav>
  );
};
