
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Edit, FileText, Folder, BookText, Users, Menu, X, FileMusic, ListMusic, DollarSign, BarChart3, Trash2, Shield, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  isCollapsed = false,
  toggleCollapse
}) => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se o usuário é admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          setIsAdmin(!!data);
        }
      } catch (error) {
        console.error('Erro ao verificar status admin:', error);
      }
    };

    checkAdminStatus();
  }, []);

  const menuItems = [{
    label: 'Dashboard',
    icon: <BarChart3 size={20} />,
    path: '/dashboard'
  }, {
    label: 'Compor',
    icon: <Edit size={20} />,
    path: '/composer'
  }, {
    label: 'Registro autoral',
    icon: <Shield size={20} />,
    path: '/dashboard/author-registration'
  }, {
    label: 'Cifrador',
    icon: <FileMusic size={20} />,
    path: '/cifrador'
  }, {
    label: 'Bases',
    icon: <FileMusic size={20} />,
    path: '/bases'
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
  }, {
    label: 'Tutoriais',
    icon: <ListMusic size={20} />,
    path: '/dashboard/tutorials'
  }, {
    label: 'Configurações',
    icon: <User size={20} />,
    path: '/dashboard/settings'
  }, {
    label: 'Lixeira',
    icon: <Trash2 size={20} />,
    path: '/dashboard/trash'
  }];

  // Adicionar item de administração se o usuário for admin
  if (isAdmin) {
    menuItems.push({
      label: 'Administração',
      icon: <Settings size={20} />,
      path: '/admin'
    });
  }

  return (
    <>
      <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden" onClick={toggleSidebar}>
        <Menu size={24} className="text-white" />
      </Button>

      <div className={cn("fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={toggleSidebar} />

      <aside className={cn(
        "fixed left-0 top-0 bottom-0 bg-black z-50 p-5 flex flex-col border-r border-sidebar-border transition-all duration-300 md:translate-x-0", 
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex items-center justify-between mb-8">
          {!isCollapsed && (
            <img 
              src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
              alt="Logo" 
              className="h-10"
            />
          )}
          <div className="flex gap-2">
            {toggleCollapse && (
              <Button variant="ghost" size="icon" className="hidden md:flex text-white" onClick={toggleCollapse}>
                <Menu size={20} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={toggleSidebar}>
              <X size={20} />
            </Button>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {menuItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={cn(
        "nav-link flex items-center rounded-lg text-white transition-colors", 
        isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
                location.pathname === item.path || location.pathname.startsWith(`${item.path}/`) 
                  ? "bg-[#111111] text-[#00bd4b]" 
                  : "hover:bg-[#111111]"
              )}
              onClick={() => {
                if (window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={isCollapsed ? "text-xl" : ""}>{item.icon}</span>
              {!isCollapsed && <span>{item.label}</span>}
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
