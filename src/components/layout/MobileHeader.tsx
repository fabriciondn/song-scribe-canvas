import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useTheme } from '@/hooks/useTheme';
import { useMobileDetection } from '@/hooks/use-mobile';
import { useUserRole } from '@/hooks/useUserRole';
import { Link, useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
  toggleSidebar?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { credits } = useUserCredits();
  const { theme } = useTheme();
  const { isMobile } = useMobileDetection();
  const { isPro } = useUserRole();
  const navigate = useNavigate();

  if (!isMobile) {
    return null;
  }

  return (
    <header className="bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 safe-area-top">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center">
        <img 
          src={theme === 'dark' ? "/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" : "/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"} 
          alt="Logo" 
          className="h-7 max-w-[100px] object-contain" 
        />
      </Link>

      {/* Right side: Credits + Plan + Avatar */}
      <div className="flex items-center gap-2">
        {/* Credits Badge */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 gap-1.5 text-xs font-medium"
          onClick={() => navigate('/credits-checkout')}
        >
          <CreditCard className="h-3.5 w-3.5 text-primary" />
          <span>{credits || 0}</span>
        </Button>

        {/* Plan Badge */}
        <Badge 
          variant={isPro ? "default" : "secondary"} 
          className={`text-[10px] px-2 py-0.5 font-semibold ${
            isPro 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0' 
              : ''
          }`}
        >
          {isPro ? (
            <>
              <Crown className="h-3 w-3 mr-1" />
              Pro
            </>
          ) : (
            'Grátis'
          )}
        </Badge>

        {/* User Avatar */}
        {user && (
          <Link to="/dashboard/settings">
            <Avatar className="h-8 w-8 ring-2 ring-border/50">
              <AvatarImage 
                src={profile?.avatar_url || ""} 
                alt={profile?.name || user.email || "User"} 
              />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {profile?.name 
                  ? profile.name.charAt(0).toUpperCase() 
                  : user.email 
                  ? user.email.charAt(0).toUpperCase() 
                  : "U"
                }
              </AvatarFallback>
            </Avatar>
          </Link>
        )}
      </div>
    </header>
  );
};
