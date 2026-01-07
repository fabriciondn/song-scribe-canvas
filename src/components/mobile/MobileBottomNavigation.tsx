import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Award, Usb, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';

interface MobileBottomNavigationProps {
  onMenuClick?: () => void;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const { isPro } = useSubscription();

  const navigationItems = [
    {
      title: 'Início',
      href: '/dashboard',
      icon: Home,
      filled: true,
    },
    {
      title: 'Certificados',
      href: '/dashboard/registered-works',
      icon: Award,
    },
    // O botão central "Compor" é especial
    ...(isPro ? [{
      title: 'Pendrive',
      href: '/pendrive',
      icon: Usb,
    }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-[#1E1E1E] border-t border-gray-800 pb-6 pt-2 px-6 flex justify-between items-center z-50">
      {/* Itens da esquerda */}
      <Link
        to="/dashboard"
        className={cn(
          'flex flex-col items-center gap-1 p-2 transition-colors',
          location.pathname === '/dashboard' ? 'text-primary' : 'text-gray-400 hover:text-white'
        )}
      >
        <Home className="w-6 h-6" fill={location.pathname === '/dashboard' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-medium">Início</span>
      </Link>

      <Link
        to="/dashboard/registered-works"
        className={cn(
          'flex flex-col items-center gap-1 p-2 transition-colors',
          location.pathname === '/dashboard/registered-works' ? 'text-primary' : 'text-gray-400 hover:text-white'
        )}
      >
        <Award className="w-6 h-6" />
        <span className="text-[10px] font-medium">Certificados</span>
      </Link>

      {/* Botão central - Compor */}
      <div className="relative -top-6 flex flex-col items-center group">
        <Link
          to="/dashboard/composer"
          className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/40 hover:scale-105 active:scale-95 transition-transform border-4 border-black"
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <span className="text-[10px] font-medium text-gray-400 mt-1 group-hover:text-primary transition-colors">Compor</span>
      </div>

      {isPro && (
        <Link
          to="/pendrive"
          className={cn(
            'flex flex-col items-center gap-1 p-2 transition-colors',
            location.pathname === '/pendrive' ? 'text-primary' : 'text-gray-400 hover:text-white'
          )}
        >
          <Usb className="w-6 h-6" />
          <span className="text-[10px] font-medium">Pendrive</span>
        </Link>
      )}

      <button
        onClick={onMenuClick}
        className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Menu className="w-6 h-6" />
        <span className="text-[10px] font-medium">Menu</span>
      </button>
    </nav>
  );
};
