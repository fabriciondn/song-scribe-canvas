import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Menu, Sun, Moon, CreditCard, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useTheme } from '@/hooks/useTheme';
import { useMobileDetection } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MobileSidebar } from './MobileSidebar';
import { AbandonedCartIndicator } from '@/components/ui/abandoned-cart-indicator';
interface MobileHeaderProps {
  toggleSidebar?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { credits } = useUserCredits();
  const { theme, toggleTheme } = useTheme();
  const { isMobile } = useMobileDetection();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!isMobile) {
    return null;
  }

  return (
    <header className="bg-background border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      {/* Menu Hamburger */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <MobileSidebar onClose={() => setIsMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Logo */}
      <Link to="/dashboard" className="flex items-center justify-center flex-1 mx-4">
        <img 
          src={theme === 'dark' ? "/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" : "/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"} 
          alt="Logo" 
          className="h-8 max-w-[120px] object-contain" 
        />
      </Link>

      {/* User Info */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Credits */}
        <Badge variant="secondary" className="text-xs px-2 py-1 hidden xs:flex">
          {credits !== null ? credits : '...'}
        </Badge>

        {/* Abandoned Cart Indicator */}
        <AbandonedCartIndicator />

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User Avatar */}
        {user && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage 
              src={profile?.avatar_url || ""} 
              alt={profile?.name || user.email || "User"} 
            />
            <AvatarFallback className="text-xs">
              {profile?.name 
                ? profile.name.charAt(0).toUpperCase() 
                : user.email 
                ? user.email.charAt(0).toUpperCase() 
                : "U"
              }
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </header>
  );
};