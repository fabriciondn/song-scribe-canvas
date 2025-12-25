import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Edit3, 
  ShieldCheck,
  Trophy,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    title: 'Início',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Compor',
    href: '/dashboard/composer',
    icon: Edit3,
  },
  {
    title: 'Registro',
    href: '/dashboard/author-registration',
    icon: ShieldCheck,
  },
  {
    title: 'Ranking',
    href: '/dashboard/ranking',
    icon: Trophy,
  },
  {
    title: 'Menu',
    href: '#',
    icon: Menu,
    action: 'menu'
  },
];

interface MobileNavigationProps {
  onToolsClick?: () => void;
  onMenuClick?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  onToolsClick,
  onMenuClick 
}) => {
  const location = useLocation();

  const handleItemClick = (item: typeof navigationItems[0], e: React.MouseEvent) => {
    if (item.action === 'menu' && onMenuClick) {
      e.preventDefault();
      onMenuClick();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      {/* Glass effect background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50" />
      
      <div className="relative flex justify-around items-center px-2 py-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          if (item.action === 'menu') {
            return (
              <button
                key={item.title}
                onClick={(e) => handleItemClick(item, e)}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-200 min-w-0 flex-1 relative',
                  'text-muted-foreground active:scale-95'
                )}
              >
                <div className="relative">
                  <item.icon className="h-6 w-6 mb-0.5" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium">
                  {item.title}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-200 min-w-0 flex-1 relative',
                'active:scale-95',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-0.5 w-8 h-1 bg-primary rounded-full" />
              )}
              <div className="relative">
                <item.icon 
                  className={cn(
                    "h-6 w-6 mb-0.5 transition-all duration-200",
                    isActive && "scale-110"
                  )} 
                  strokeWidth={isActive ? 2 : 1.5} 
                />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                isActive && "font-semibold"
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
