import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  Music, 
  FolderOpen, 
  ShieldCheck, 
  CreditCard, 
  Plus, 
  LogOut, 
  Settings,
  Shield,
  FileText,
  Mic,
  Trash2,
  BookOpen,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useRoleBasedNavigation } from '@/hooks/useRoleBasedNavigation';
// import { logUserActivity } from '@/services/userActivityService'; // Removido para melhorar performance
import { cn } from '@/lib/utils';

interface MobileSidebarProps {
  onClose: () => void;
}

const mainNavigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Compositor',
    href: '/dashboard/composer',
    icon: Music,
  },
  {
    title: 'Bases Musicais',
    href: '/dashboard/bases',
    icon: Mic,
  },
  {
    title: 'Pastas',
    href: '/dashboard/folders',
    icon: FolderOpen,
  },
  {
  title: 'Rascunho',
    href: '/dashboard/drafts',
    icon: FileText,
  },
  {
    title: 'Registro de Obras',
    href: '/dashboard/registered-works',
    icon: ShieldCheck,
  },
  {
    title: 'Tutoriais',
    href: '/dashboard/tutorials',
    icon: BookOpen,
  },
  {
    title: 'Parcerias',
    href: '/dashboard/partnerships',
    icon: Users,
  },
  {
    title: 'Lixeira',
    href: '/dashboard/trash',
    icon: Trash2,
  },
];

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const { credits } = useUserCredits();
  const { userRole, getDefaultDashboard } = useRoleBasedNavigation();

  const handleLogout = async () => {
    try {
      // Removido logUserActivity para melhorar performance
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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* User Profile Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={profile?.avatar_url || ""} 
              alt={profile?.name || user?.email || "User"} 
            />
            <AvatarFallback>
              {profile?.name 
                ? profile.name.charAt(0).toUpperCase() 
                : user?.email 
                ? user.email.charAt(0).toUpperCase() 
                : "U"
              }
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">
              {profile?.name || profile?.artistic_name || user?.email}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <CreditCard className="h-3 w-3 mr-1" />
                {credits || 0} créditos
              </Badge>
            </div>
          </div>
        </div>

        {/* Add Credits Button */}
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full mt-3"
          onClick={() => {
            navigate('/credits-checkout');
            onClose();
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Créditos
        </Button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {mainNavigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  'w-full justify-start gap-3 h-12',
                  isActive && 'bg-primary/10 text-primary font-medium'
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Button>
            );
          })}
        </nav>

        <Separator className="my-4 mx-3" />

        {/* Admin/Moderator Section */}
        {(userRole?.role === 'admin' || userRole?.role === 'moderator') && (
          <div className="px-3 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={handleDashboardClick}
            >
              {userRole?.role === 'admin' ? (
                <>
                  <Settings className="h-5 w-5" />
                  <span>Painel Admin</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Painel Moderador</span>
                </>
              )}
            </Button>
            <Separator className="my-4" />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => handleNavigation('/dashboard/settings')}
        >
          <Settings className="h-5 w-5" />
          <span>Configurações</span>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );
};