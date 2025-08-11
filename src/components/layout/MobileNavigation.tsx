import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Music, 
  FolderOpen, 
  FileText, 
  ShieldCheck,
  Users 
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
    icon: Music,
  },
  {
    title: 'IA+Tools',
    href: '#',
    icon: Users,
    action: 'tools'
  },
  {
    title: 'Registro',
    href: '/dashboard/author-registration',
    icon: ShieldCheck,
  },
];

interface MobileNavigationProps {
  onToolsClick?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ onToolsClick }) => {
  const location = useLocation();

  const handleItemClick = (item: typeof navigationItems[0]) => {
    if (item.action === 'tools' && onToolsClick) {
      onToolsClick();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
      <div className="flex justify-around items-center px-2 py-1">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          if (item.action === 'tools') {
            return (
              <button
                key={item.title}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-0 flex-1',
                  'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate">
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
                'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-0 flex-1',
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};