import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Music, 
  ShieldCheck,
  Usb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';

interface MobileNavigationProps {
  onToolsClick?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = () => {
  const location = useLocation();
  const { isPro } = useSubscription();

  const navigationItems = [
    {
      title: 'Início',
      href: '/dashboard',
      icon: Home,
    },
    {
      title: 'Compor',
      href: '/dashboard/drafts',
      icon: Music,
    },
    ...(isPro ? [{
      title: 'Pendrive',
      href: '/pendrive',
      icon: Usb,
    }] : []),
    {
      title: 'Registro',
      href: '/dashboard/author-registration',
      icon: ShieldCheck,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border/50 z-50 safe-area-bottom">
      <div className="flex justify-around items-center px-1 py-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-200 min-w-0',
                isActive 
                  ? 'text-primary bg-primary/15 scale-105' 
                  : 'text-muted-foreground hover:text-foreground active:scale-95'
              )}
            >
              <item.icon className={cn(
                "mb-1 transition-all",
                isActive ? "h-6 w-6" : "h-5 w-5"
              )} />
              <span className={cn(
                "font-medium truncate transition-all",
                isActive ? "text-xs" : "text-[11px]"
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
