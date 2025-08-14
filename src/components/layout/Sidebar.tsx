import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Edit, FileText, Folder, BookText, Users, Menu, X, FileMusic, ListMusic, DollarSign, BarChart3, Trash2, Shield, User, Settings, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { FunctionAwareMenuItem } from '@/components/layout/FunctionAwareMenuItem';
import { useUserRole } from '@/hooks/useUserRole';
import { useTheme } from '@/hooks/useTheme';
import { FunctionStatusTag } from '@/components/layout/FunctionStatusTag';

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
  const { isPro, isAdmin, isLoading } = useUserRole();
  const { theme } = useTheme();

  // Funções disponíveis para usuários básicos (não-PRO)
  const basicFunctions = ['author-registration', 'settings', 'dashboard'];
  
  // Verificar se a função deve ser acessível baseado no papel do usuário
  const canAccessFunction = (functionKey: string) => {
    // Admins têm acesso total
    if (isAdmin) return true;
    
    // Usuários básicos só têm acesso ao registro autoral, configurações e dashboard
    if (!isPro && !basicFunctions.includes(functionKey)) {
      return false;
    }
    
    return true;
  };

  const menuItems = [{
    label: 'Dashboard',
    icon: BarChart3,
    path: '/dashboard',
    functionKey: 'dashboard',
    isPro: false
  }, {
    label: 'Registro autoral',
    icon: Shield,
    path: '/dashboard/author-registration',
    functionKey: 'author-registration',
    isPro: false
  }, {
    label: 'Compor',
    icon: Edit,
    path: '/composer',
    functionKey: 'composer',
    isPro: true
  }, {
    label: 'Cifrador',
    icon: FileMusic,
    path: '/cifrador',
    functionKey: 'cifrador',
    isPro: true
  }, {
    label: 'Bases',
    icon: FileMusic,
    path: '/bases',
    functionKey: 'bases',
    isPro: true
  }, {
    label: 'Pastas',
    icon: Folder,
    path: '/folders',
    functionKey: 'folders',
    isPro: true
  }, {
    label: 'Rascunhos',
    icon: BookText,
    path: '/drafts',
    functionKey: 'drafts',
    isPro: true
  }, {
    label: 'Parcerias',
    icon: Users,
    path: '/partnerships',
    functionKey: 'partnerships',
    isPro: true
  }, {
    label: 'Tutoriais',
    icon: ListMusic,
    path: '/dashboard/tutorials',
    functionKey: 'tutorials',
    isPro: true
  }, {
    label: 'Configurações',
    icon: User,
    path: '/dashboard/settings',
    functionKey: 'settings',
    isPro: false
  }, {
    label: 'Planos',
    icon: Crown,
    path: '/plans',
    functionKey: 'plans',
    isPro: false
  }, {
    label: 'Lixeira',
    icon: Trash2,
    path: '/dashboard/trash',
    functionKey: 'trash',
    isPro: true
  }];

  // Adicionar itens administrativos se o usuário for admin
  if (isAdmin) {
    menuItems.push({
      label: 'Administração',
      icon: Settings,
      path: '/admin',
      functionKey: 'admin',
      isPro: false
    });
    menuItems.push({
      label: 'Moderação',
      icon: Shield,
      path: '/moderator',
      functionKey: 'moderator',
      isPro: false
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
              src={theme === 'dark' ? "/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" : "/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"}
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
          {menuItems.map(item => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            const hasAccess = canAccessFunction(item.functionKey);
            
            return (
              <div key={item.path}>
                {hasAccess ? (
                  <Link 
                    to={item.path} 
                    className={cn(
                      "nav-link flex items-center rounded-lg text-white transition-colors", 
                      isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
                      isActive 
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
                    <item.icon size={20} />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span>{item.label}</span>
                        <FunctionStatusTag functionKey={item.functionKey} />
                      </div>
                    )}
                  </Link>
                ) : (
                  <div 
                    className={cn(
                      "nav-link flex items-center rounded-lg text-gray-500 cursor-not-allowed", 
                      isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon size={20} />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span>{item.label}</span>
                        <FunctionStatusTag functionKey={item.functionKey} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="pt-4 mt-auto border-t border-sidebar-border">
          <p className="text-xs text-gray-400 text-center">Compuse v1.0</p>
        </div>
      </aside>
    </>
  );
};