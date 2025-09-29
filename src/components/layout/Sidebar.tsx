
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Edit, FileText, Folder, BookText, Users, Menu, X, FileMusic, ListMusic, DollarSign, BarChart3, Trash2, Shield, User, Settings, Crown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { FunctionAwareMenuItem } from '@/components/layout/FunctionAwareMenuItem';
import { useUserRole } from '@/hooks/useUserRole';
import { useTheme } from '@/hooks/useTheme';
import { FunctionStatusTag } from '@/components/layout/FunctionStatusTag';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useAffiliateRole } from '@/hooks/useAffiliateRole';

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
  const navigate = useNavigate();
  const { isPro, isAdmin, isLoading } = useUserRole();
  const { isAffiliate } = useAffiliateRole();
  const { theme } = useTheme();
  const { menuItems, isLoading: menuLoading } = useMenuItems();

  // Funções disponíveis para usuários básicos (não-PRO)
  const basicFunctions = ['author-registration', 'settings', 'dashboard', 'trash', 'plans', 'my-purchases', 'upgrade'];
  
  // Verificar se a função deve ser acessível baseado no papel do usuário
  const canAccessFunction = (functionKey: string) => {
    // Apenas admins têm acesso total automático
    if (isAdmin) return true;
    
    // Usuários básicos (incluindo moderadores sem Pro) só têm acesso às funções básicas
    if (!isPro && !basicFunctions.includes(functionKey)) {
      return false;
    }
    
    return true;
  };

  // Handle affiliate navigation
  const handleAffiliateClick = () => {
    if (isAffiliate) {
      navigate('/affiliate');
    } else {
      navigate('/affiliate-application');
    }
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  // Filter menu items by admin access and user access
  const visibleMenuItems = useMemo(() => {
    let items = menuItems;
    
    // Filter by admin status
    if (!isAdmin) {
      items = items.filter(item => !['admin', 'moderator'].includes(item.functionKey));
    }
    
    // Show "Upgrade Pro" only for non-Pro users
    if (isPro) {
      items = items.filter(item => item.functionKey !== 'upgrade');
    }
    
    // Remove affiliate from normal menu since we handle it separately
    items = items.filter(item => item.functionKey !== 'affiliate');
    
    return items;
  }, [menuItems, isAdmin, isPro]);

  return (
    <>
      <Button variant="ghost" size="icon" className="fixed top-20 left-4 z-50 md:hidden" onClick={toggleSidebar}>
        <Menu size={24} className="text-white" />
      </Button>

      <div className={cn("fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={toggleSidebar} />

      <aside className={cn(
        "fixed left-0 top-0 bottom-0 bg-black z-50 pt-16 p-5 flex flex-col border-r border-sidebar-border transition-all duration-300 md:translate-x-0", 
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
          {menuLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded" />
              ))}
            </div>
          ) : (
            visibleMenuItems.map(item => {
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
                        {item.functionKey === 'cifrador-neo' && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-600 text-white">Beta</span>
                        )}
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
            })
          )}
          
          {/* Affiliate Menu Item - Separate from normal menu */}
          <div
            onClick={handleAffiliateClick}
            className={cn(
              "nav-link flex items-center rounded-lg text-white transition-colors cursor-pointer",
              isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
              location.pathname.startsWith('/affiliate')
                ? "bg-[#111111] text-[#00bd4b]"
                : "hover:bg-[#111111]"
            )}
            title={isCollapsed ? "Afiliados" : undefined}
          >
            <TrendingUp size={20} />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Afiliados</span>
                {isAffiliate && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-600 text-white">Ativo</span>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="pt-4 mt-auto border-t border-sidebar-border space-y-2">
          {!isCollapsed && (
            <>
              {isPro ? (
                <div className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600/20 rounded-lg">
                  <Crown className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">Pro Ativo</span>
                </div>
              ) : (
                <Link 
                  to="/subscription-checkout" 
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      toggleSidebar();
                    }
                  }}
                >
                  <Crown className="h-4 w-4" />
                  <span className="text-sm font-medium">Fazer Upgrade</span>
                </Link>
              )}
            </>
          )}
          <p className="text-xs text-gray-400 text-center">Compuse v1.0</p>
        </div>
      </aside>
    </>
  );
};
