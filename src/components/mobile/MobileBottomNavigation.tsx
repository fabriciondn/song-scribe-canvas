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

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-[#1E1E1E] border-t border-gray-800 pb-6 pt-2 px-6 flex justify-between items-center z-50 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Início */}
      <Link
        to="/dashboard"
        className={cn(
          'flex flex-col items-center gap-1 p-2 transition-colors',
          isActive('/dashboard') ? 'text-[#00C853]' : 'text-[#9CA3AF] hover:text-white'
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
          isActive('/dashboard/registered-works') ? 'text-[#00C853]' : 'text-[#9CA3AF] hover:text-white'
        )}
      >
        <MaterialIcon name="workspace_premium" filled={isActive('/dashboard/registered-works')} />
        <span className="text-[10px] font-medium">Certificados</span>
      </Link>

      {/* Botão central - Compor */}
      <div className="relative -top-6 flex flex-col items-center group">
        <Link
          to="/dashboard/composer"
          className="w-14 h-14 bg-[#00C853] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#00C853]/40 hover:scale-105 active:scale-95 transition-transform border-4 border-[#000000]"
        >
          <MaterialIcon name="history_edu" className="text-3xl" />
        </Link>
        <span className="text-[10px] font-medium text-[#9CA3AF] mt-1 group-hover:text-[#00C853] transition-colors">Compor</span>
      </div>

      {/* Pendrive */}
      <Link
        to="/pendrive"
        className={cn(
          'flex flex-col items-center gap-1 p-2 transition-colors',
          isActive('/pendrive') ? 'text-[#00C853]' : 'text-[#9CA3AF] hover:text-white'
        )}
      >
        <MaterialIcon name="usb" filled={isActive('/pendrive')} />
        <span className="text-[10px] font-medium">Pendrive</span>
      </Link>

      {/* Menu */}
      <button
        onClick={onMenuClick}
        className="flex flex-col items-center gap-1 p-2 text-[#9CA3AF] hover:text-white transition-colors"
      >
        <MaterialIcon name="menu" />
        <span className="text-[10px] font-medium">Menu</span>
      </button>
    </nav>
  );
};
