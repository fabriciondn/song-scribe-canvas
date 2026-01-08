import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useRoleBasedNavigation } from '@/hooks/useRoleBasedNavigation';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface MobileSidebarProps {
  onClose: () => void;
}

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

const mainNavigationItems = [
  { title: 'Dashboard', href: '/dashboard', icon: 'grid_view' },
  { title: 'Compositor', href: '/dashboard/composer', icon: 'view_column' },
  { title: 'Bases Musicais', href: '/dashboard/bases', icon: 'equalizer' },
  { title: 'Pastas', href: '/dashboard/folders', icon: 'folder' },
  { title: 'Rascunhos', href: '/dashboard/drafts', icon: 'sort', showBadge: true },
  { title: 'Registro de Obras', href: '/dashboard/registered-works', icon: 'copyright' },
];

const secondaryNavigationItems = [
  { title: 'Tutoriais', href: '/dashboard/tutorials', icon: 'school' },
  { title: 'Parcerias', href: '/dashboard/partnerships', icon: 'handshake' },
  { title: 'Ranking', href: '/dashboard/ranking', icon: 'leaderboard' },
  { title: 'Lixeira', href: '/dashboard/trash', icon: 'delete' },
];

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const { subscription } = useSubscription();
  const { userRole, getDefaultDashboard } = useRoleBasedNavigation();
  const [draftsCount, setDraftsCount] = useState<number>(0);

  // Buscar contagem real de rascunhos
  useEffect(() => {
    const fetchDraftsCount = async () => {
      if (!user?.id) return;
      
      const { count, error } = await supabase
        .from('drafts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('deleted_at', null);
      
      if (!error && count !== null) {
        setDraftsCount(count);
      }
    };
    
    fetchDraftsCount();
  }, [user?.id]);

  const userName = profile?.artistic_name || profile?.name || 'Usuário';
  const userAvatar = profile?.avatar_url;
  const userInitials = userName.substring(0, 2).toUpperCase();
  const planLabel = subscription?.status === 'active' ? 'Plano Pro' : subscription?.status === 'trial' ? 'Trial' : 'Gratuito';

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDashboardClick = () => {
    const defaultDashboard = getDefaultDashboard();
    navigate(defaultDashboard);
    onClose();
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    onClose();
  };

  const handleSupport = () => {
    window.open('https://wa.me/5519995081355?text=oi%20vim%20pelo%20site%20da%20compuse%2C%20poderia%20me%20ajudar%3F', '_blank');
    onClose();
  };

  const handleUpdateApp = async () => {
    try {
      // Check for service worker updates
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
      // Clear caches and reload
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen bg-[#0A0A0A] overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* User Profile Section */}
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-[#00C853]">
              <AvatarImage src={userAvatar || ""} alt={userName} />
              <AvatarFallback className="bg-[#1E1E1E] text-white text-lg font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-white truncate">{userName}</h3>
            <p className="text-sm text-[#9CA3AF]">{planLabel}</p>
          </div>
        </div>

        {/* Upgrade Button */}
        <div className="flex gap-3">
          <Button 
            className="flex-1 h-12 bg-[#1A3D2E] hover:bg-[#1A3D2E]/80 text-[#00C853] font-semibold rounded-xl border-0"
            onClick={() => {
              navigate('/plans');
              onClose();
            }}
          >
            Upgrade
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 bg-[#1E293B] hover:bg-[#1E293B]/80 rounded-xl"
            onClick={() => handleNavigation('/dashboard/settings')}
          >
            <MaterialIcon name="settings" className="text-[#9CA3AF]" />
          </Button>
        </div>
      </div>

      <Separator className="bg-gray-800 mx-4" />

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-4">
        <nav className="space-y-1">
          {mainNavigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <button
                key={item.href}
                className={cn(
                  'w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-colors',
                  isActive 
                    ? 'bg-[#1A3D2E] text-[#00C853]' 
                    : 'text-[#9CA3AF] hover:bg-white/5'
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <MaterialIcon name={item.icon} filled={isActive} className="text-xl" />
                <span className="font-medium flex-1">{item.title}</span>
                {item.showBadge && draftsCount > 0 && (
                  <Badge className="bg-[#00C853] text-black text-xs font-bold px-2">
                    {draftsCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <Separator className="my-4 bg-gray-800" />

        <nav className="space-y-1">
          {secondaryNavigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <button
                key={item.href}
                className={cn(
                  'w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-colors',
                  isActive 
                    ? 'bg-[#1A3D2E] text-[#00C853]' 
                    : 'text-[#9CA3AF] hover:bg-white/5'
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <MaterialIcon name={item.icon} filled={isActive} className="text-xl" />
                <span className="font-medium">{item.title}</span>
              </button>
            );
          })}
        </nav>

        <Separator className="my-4 bg-gray-800" />

        {/* Configurações e Suporte */}
        <nav className="space-y-1">
          <button
            className={cn(
              'w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-colors',
              location.pathname === '/dashboard/settings'
                ? 'bg-[#1A3D2E] text-[#00C853]'
                : 'text-[#9CA3AF] hover:bg-white/5'
            )}
            onClick={() => handleNavigation('/dashboard/settings')}
          >
            <MaterialIcon name="settings" className="text-xl" />
            <span className="font-medium">Configurações</span>
          </button>
          
          <button
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-[#9CA3AF] hover:bg-white/5 transition-colors"
            onClick={handleSupport}
          >
            <MaterialIcon name="support_agent" className="text-xl" />
            <span className="font-medium">Suporte</span>
          </button>

          <button
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-[#9CA3AF] hover:bg-white/5 transition-colors"
            onClick={handleUpdateApp}
          >
            <MaterialIcon name="sync" className="text-xl" />
            <span className="font-medium">Atualizar App</span>
          </button>
        </nav>

        {/* Admin/Moderator Section */}
        {(userRole?.role === 'admin' || userRole?.role === 'moderator') && (
          <>
            <Separator className="my-4 bg-gray-800" />
            <button
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-[#9CA3AF] hover:bg-white/5 transition-colors"
              onClick={handleDashboardClick}
            >
              <MaterialIcon name={userRole?.role === 'admin' ? 'admin_panel_settings' : 'shield_person'} className="text-xl" />
              <span className="font-medium">
                {userRole?.role === 'admin' ? 'Painel Admin' : 'Painel Moderador'}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 flex-shrink-0">
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
          onClick={handleLogout}
        >
          <MaterialIcon name="logout" className="text-xl" />
          <span className="font-medium">Sair da conta</span>
        </button>
        
        <p className="text-center text-xs text-[#6B7280] mt-4">Versão 2.4.0</p>
      </div>
    </div>
  );
};
