import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';
import { Link } from 'react-router-dom';
import { Menu, LogOut, Music, Home, CreditCard, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
export const Header = ({
  toggleSidebar
}: {
  toggleSidebar: () => void;
}) => {
  const {
    user,
    logout
  } = useAuth();
  const { credits } = useUserCredits();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
  return <header className="bg-white border-b border-gray-200 py-3 px-6 flex items-center justify-between">
      <div className="flex items-center flex-1">
        <Button variant="ghost" size="icon" className="mr-2 lg:hidden" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="flex items-center gap-2 mr-12">
          <img src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" alt="Logo" className="h-9" />
        </Link>
        
      </div>
      
      {user ? (
        <div className="flex items-center gap-3">
          {/* Exibição dos créditos */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              {credits || 0} créditos
            </Badge>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 px-2"
              onClick={() => {
                // TODO: Implementar modal para adicionar créditos
                console.log('Adicionar créditos via Pix');
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" alt={user.email || "User"} />
                  <AvatarFallback>
                    {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {credits || 0} créditos disponíveis
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  // TODO: Implementar modal para adicionar créditos
                  console.log('Adicionar créditos via Pix');
                }}
              >
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
        </div>
      ) : (
        <Link to="/">
          <Button size="sm">Entrar</Button>
        </Link>
      )}
    </header>;
};