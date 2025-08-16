import React, { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useTheme } from '@/hooks/useTheme';
import { useRoleBasedNavigation } from '@/hooks/useRoleBasedNavigation';
// import { logUserActivity } from '@/services/userActivityService'; // Removido para melhorar performance
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Music, Home, CreditCard, Plus, Moon, Sun, Shield, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Header = ({
  toggleSidebar
}: {
  toggleSidebar: () => void;
}) => {
  const navigate = useNavigate();
  const {
    user,
    logout
  } = useAuth();
  const {
    profile
  } = useProfile();
  const {
    credits,
    refreshCredits
  } = useUserCredits();
  
  // Adicionar listener para mudanças nos créditos via window events
  useEffect(() => {
    const handleCreditsUpdate = () => {
      console.log('🔄 Evento de atualização de créditos detectado');
      refreshCredits();
    };
    
    window.addEventListener('credits-updated', handleCreditsUpdate);
    return () => window.removeEventListener('credits-updated', handleCreditsUpdate);
  }, [refreshCredits]);
  const {
    theme,
    toggleTheme
  } = useTheme();
  const { userRole, getDefaultDashboard } = useRoleBasedNavigation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Removido logUserActivity para melhorar performance
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDashboardClick = () => {
    const defaultDashboard = getDefaultDashboard();
    navigate(defaultDashboard);
  };
  return <header className="bg-background border-b border-border py-3 px-6 flex items-center justify-between">
      <div className="flex items-center flex-1 mx-[68px]">
        <Button variant="ghost" size="icon" className="mr-2 lg:hidden" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="flex items-center gap-2 mr-12">
          <img 
            src={theme === 'dark' ? "/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" : "/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"} 
            alt="Logo" 
            className="h-9" 
          />
        </Link>
        
      </div>
      
      {user ? <div className="flex items-center gap-3">
          
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="mr-2">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Exibição dos créditos */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              {credits || 0} créditos
            </Badge>
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => navigate('/credits-checkout')}>
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.avatar_url || ""} alt={profile?.name || user.email || "User"} />
                  <AvatarFallback>
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.name || profile?.artistic_name || user.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {credits || 0} créditos disponíveis
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Dashboard navigation based on role */}
              <DropdownMenuItem onClick={handleDashboardClick}>
                {userRole?.role === 'admin' ? (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Painel Admin</span>
                  </>
                ) : userRole?.role === 'moderator' ? (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Painel Moderador</span>
                  </>
                ) : (
                  <>
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </>
                )}
              </DropdownMenuItem>
              
               <DropdownMenuItem onClick={() => navigate('/credits-checkout')}>
                 <CreditCard className="mr-2 h-4 w-4" />
                 <span>Adicionar Créditos</span>
               </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={isLoggingOut} onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div> : <Link to="/">
          <Button size="sm">Entrar</Button>
        </Link>}
    </header>;
};