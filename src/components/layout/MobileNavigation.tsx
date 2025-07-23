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
    title: 'Compositor',
    href: '/dashboard/composer',
    icon: Music,
  },
  {
    title: 'Pastas',
    href: '/dashboard/folders',
    icon: FolderOpen,
  },
  {
    title: 'Modelos',
    href: '/dashboard/templates',
    icon: FileText,
  },
  {
    title: 'Registro',
    href: '/dashboard/author-registration',
    icon: ShieldCheck,
  },
];

export const MobileNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
      <div className="flex justify-around items-center px-2 py-1">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          
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