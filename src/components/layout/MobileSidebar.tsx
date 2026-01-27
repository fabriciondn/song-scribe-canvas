import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
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
  { title: 'Sorteio', href: '/dashboard/sorteio', icon: 'redeem' },
  { title: 'Lixeira', href: '/dashboard/trash', icon: 'delete' },
];

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const { subscription } = useSubscription();
  const { userRole, getDefaultDashboard } = useRoleBasedNavigation();
  const { toast } = useToast();
  const [draftsCount, setDraftsCount] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

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
    if (isUpdating) return;
    setIsUpdating(true);
    
    toast({
      title: "Atualizando...",
      description: "Buscando atualizações do aplicativo.",
    });
    
    try {
      // Check for service worker updates
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      toast({
        title: "App atualizado!",
        description: "A página será recarregada com as novas funcionalidades.",
      });
      
      // Small delay to show the toast before reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast({
        title: "Atualizando...",
        description: "Recarregando a página.",
      });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen bg-background overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* User Profile Section */}
      <div 
        className="px-6 pb-6 flex-shrink-0"
        style={{ paddingTop: 'max(24px, calc(env(safe-area-inset-top, 0px) + 16px))' }}
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarImage src={userAvatar || ""} alt={userName} />
              <AvatarFallback className="bg-muted text-foreground text-lg font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground truncate">{userName}</h3>
            <p className="text-sm text-muted-foreground">{planLabel}</p>
          </div>
        </div>

        {/* Upgrade Button or Renewal Date */}
        <div className="flex gap-3">
          {subscription?.status === 'active' && subscription?.plan_type === 'pro' ? (
            <div className="flex-1 h-12 bg-[#1A3D2E] rounded-xl flex items-center justify-center gap-2 px-4">
              <MaterialIcon name="autorenew" className="text-[#00C853] text-lg" />
              <span className="text-[#00C853] font-medium text-sm">
                {subscription?.expires_at 
                  ? `Renova em ${new Date(subscription.expires_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
                  : 'Assinatura ativa'
                }
              </span>
            </div>
          ) : (
            <Button 
              className="flex-1 h-12 bg-[#1A3D2E] hover:bg-[#1A3D2E]/80 text-[#00C853] font-semibold rounded-xl border-0"
              onClick={() => {
                navigate('/plans');
                onClose();
              }}
            >
              Upgrade
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 bg-muted hover:bg-muted/80 rounded-xl"
            onClick={() => handleNavigation('/dashboard/settings')}
          >
            <MaterialIcon name="settings" className="text-muted-foreground" />
          </Button>
        </div>
      </div>

      <Separator className="bg-border mx-4" />

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
                    ? 'bg-primary/20 text-primary' 
                    : 'text-muted-foreground hover:bg-accent'
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <MaterialIcon name={item.icon} filled={isActive} className="text-xl" />
                <span className="font-medium flex-1">{item.title}</span>
                {item.showBadge && draftsCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-xs font-bold px-2">
                    {draftsCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <Separator className="my-4 bg-border" />

        <nav className="space-y-1">
          {secondaryNavigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <button
                key={item.href}
                className={cn(
                  'w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-colors',
                  isActive 
                    ? 'bg-primary/20 text-primary' 
                    : 'text-muted-foreground hover:bg-accent'
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <MaterialIcon name={item.icon} filled={isActive} className="text-xl" />
                <span className="font-medium">{item.title}</span>
              </button>
            );
          })}
        </nav>

        <Separator className="my-4 bg-border" />

        {/* Suporte e Atualizar */}
        <nav className="space-y-1">
          <button
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-muted-foreground hover:bg-accent transition-colors"
            onClick={handleSupport}
          >
            <MaterialIcon name="support_agent" className="text-xl" />
            <span className="font-medium">Suporte</span>
          </button>

          <button
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-colors",
              isUpdating ? "text-primary bg-primary/20" : "text-muted-foreground hover:bg-accent"
            )}
            onClick={handleUpdateApp}
            disabled={isUpdating}
          >
            <MaterialIcon name="sync" className={cn("text-xl", isUpdating && "animate-spin")} />
            <span className="font-medium">{isUpdating ? "Atualizando..." : "Atualizar App"}</span>
          </button>
        </nav>

        {/* Admin/Moderator Section */}
        {(userRole?.role === 'admin' || userRole?.role === 'moderator') && (
          <>
            <Separator className="my-4 bg-border" />
            <button
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-muted-foreground hover:bg-accent transition-colors"
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
        
        <p className="text-center text-xs text-muted-foreground mt-4">Versão 2.4.0</p>
      </div>
    </div>
  );
};
