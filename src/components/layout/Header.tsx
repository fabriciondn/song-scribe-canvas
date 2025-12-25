
import React, { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrialBanner } from '@/components/ui/TrialBanner';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useTheme } from '@/hooks/useTheme';
import { useUserRole } from '@/hooks/useUserRole'; // Hook unificado
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Home, CreditCard, Plus, Moon, Sun, Shield, Settings } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen?: boolean;
  isSidebarCollapsed?: boolean;
}

export const Header = ({
  toggleSidebar,
  isSidebarOpen = true,
  isSidebarCollapsed = false
}: HeaderProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const { credits, refreshCredits } = useUserCredits();
  const { theme, toggleTheme } = useTheme();
  
  // Usar apenas o hook unificado para evitar conflitos
  const { isAdmin, isModerator, role, isLoading: roleLoading } = useUserRole();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Adicionar listener para mudanças nos créditos via window events
  useEffect(() => {
    const handleCreditsUpdate = () => {
      console.log('🔄 Evento de atualização de créditos detectado');
      refreshCredits();
    };
    
    window.addEventListener('credits-updated', handleCreditsUpdate);
    return () => window.removeEventListener('credits-updated', handleCreditsUpdate);
  }, [refreshCredits]);
  
  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDashboardClick = () => {
    // Navegação baseada no role atual
    if (isAdmin) {
      navigate('/admin');
    } else if (isModerator) {
      navigate('/moderator');
    } else {
      navigate('/dashboard');
    }
  };

  // Determinar qual dashboard mostrar no menu - com fallback para evitar flickering
  const getDashboardMenuItem = () => {
    if (roleLoading) {
      return {
        icon: Home,
        text: 'Dashboard'
      };
    }

    if (isAdmin) {
      return {
        icon: Settings,
        text: 'Painel Admin'
      };
    }

    if (isModerator) {
      return {
        icon: Shield,
        text: 'Painel Moderador'
      };
    }

    return {
      icon: Home,
      text: 'Dashboard'
    };
  };

  const dashboardMenuItem = getDashboardMenuItem();

  // Determinar se deve mostrar o logo baseado no estado do sidebar
  const shouldShowLogo = isSidebarCollapsed || !isSidebarOpen;

  return (
    <header className={`fixed top-0 right-0 z-50 bg-background border-b border-border py-2 px-6 flex items-center left-0 ${isSidebarCollapsed ? 'md:left-16' : 'md:left-64'}`}>
      {/* Left section */}
      <div className="flex items-center flex-1">
        <Button variant="ghost" size="icon" className="mr-2 lg:hidden" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        {shouldShowLogo && (
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={theme === 'dark' ? "/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" : "/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"} 
              alt="Logo" 
              className="h-8" 
            />
          </Link>
        )}
      </div>
      
      {/* Center section - Trial Banner */}
      <div className="flex justify-center flex-1">
        <TrialBanner />
      </div>
      
      {/* Right section */}
      <div className="flex items-center flex-1 justify-end">
        {user ? (
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <Link to="/">
            <Button size="sm">Entrar</Button>
          </Link>
        )}
      </div>
    </header>
  );
};
