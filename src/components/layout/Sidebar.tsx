
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Edit, FileText, Folder, BookText, Users, Menu, X, Music, FileMusic, ListMusic, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar
}) => {
  const location = useLocation();
  const menuItems = [{
    label: 'Início',
    icon: <Home size={20} />,
    path: '/dashboard'
  }, {
    label: 'Compor',
    icon: <Edit size={20} />,
    path: '/composer'
  }, {
    label: 'Cifrador',
    icon: <Music size={20} />,
    path: '/cifrador'
  }, {
    label: 'Bases',
    icon: <FileMusic size={20} />,
    path: '/bases'
  }, {
    label: 'Guia Musical',
    icon: <ListMusic size={20} />,
    path: '/guia-musical'
  }, {
    label: 'Modelos de DA',
    icon: <FileText size={20} />,
    path: '/templates'
  }, {
    label: 'Pastas',
    icon: <Folder size={20} />,
    path: '/folders'
  }, {
    label: 'Rascunhos',
    icon: <BookText size={20} />,
    path: '/drafts'
  }, {
    label: 'Parcerias',
    icon: <Users size={20} />,
    path: '/partnerships'
  }];

  return (
    <>
      <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden" onClick={toggleSidebar}>
        <Menu size={24} className="text-white" />
      </Button>

      <div className={cn("fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={toggleSidebar} />

      <aside className={cn("fixed left-0 top-0 bottom-0 w-64 bg-black z-50 p-5 flex flex-col border-r border-sidebar-border transition-transform duration-300 md:translate-x-0", isOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between mb-8">
          <img 
            src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
            alt="Logo" 
            className="h-10"
          />
          <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={toggleSidebar}>
            <X size={20} />
          </Button>
        </div>

        <nav className="space-y-2 flex-1">
          {menuItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={cn(
                "nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-white transition-colors", 
                location.pathname === item.path || location.pathname.startsWith(`${item.path}/`) 
                  ? "bg-[#111111] text-[#00bd4b]" 
                  : "hover:bg-[#111111]"
              )}
              onClick={() => {
                if (window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-4 mt-auto border-t border-sidebar-border">
          <p className="text-xs text-gray-400 text-center">Compuse v1.0</p>
        </div>
      </aside>
    </>
  );
};
