import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  Edit3, 
  FolderOpen, 
  ShieldCheck, 
  CreditCard, 
  Plus, 
  LogOut, 
  Settings,
  Shield,
  FileText,
  Trash2,
  BookOpen,
  Users,
  MessageCircle,
  Crown,
  Usb,
  FileMusic,
  TrendingUp,
  ShoppingBag,
  Sun,
  Moon,
  Trophy,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useRoleBasedNavigation } from '@/hooks/useRoleBasedNavigation';
import { useUserRole } from '@/hooks/useUserRole';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface MobileSidebarProps {
  onClose: () => void;
}

// Seções do menu organizadas
const menuSections = [
  {
    title: 'Criação',
    items: [
      { title: 'Compor', href: '/dashboard/composer', icon: Edit3, isPro: true },
      { title: 'Cifrador', href: '/dashboard/cifrador-neo', icon: FileMusic, isPro: true },
      { title: 'Parcerias', href: '/dashboard/partnerships', icon: Users, isPro: true },
    ]
  },
  {
    title: 'Biblioteca',
    items: [
      { title: 'Pastas', href: '/dashboard/folders', icon: FolderOpen, isPro: true },
      { title: 'Rascunhos', href: '/dashboard/drafts', icon: FileText, isPro: true },
      { title: 'Pendrive', href: '/dashboard/pendrive', icon: Usb, isPro: false },
      { title: 'Lixeira', href: '/dashboard/trash', icon: Trash2, isPro: true },
    ]
  },
  {
    title: 'Conta',
    items: [
      { title: 'Minhas Compras', href: '/dashboard/my-purchases', icon: ShoppingBag, isPro: false },
      { title: 'Ranking', href: '/dashboard/ranking', icon: Trophy, isPro: false },
      { title: 'Tutoriais', href: '/dashboard/tutorials', icon: BookOpen, isPro: false },
      { title: 'Afiliados', href: '/affiliate', icon: TrendingUp, isPro: false },
    ]
  },
];

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const { credits } = useUserCredits();
  const { userRole, getDefaultDashboard } = useRoleBasedNavigation();
  const { isPro } = useUserRole();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    onClose();
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="flex flex-col h-full max-h-screen bg-background overflow-hidden">
      {/* Header com perfil */}
      <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage 
                src={profile?.avatar_url || ""} 
                alt={profile?.name || user?.email || "User"} 
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {profile?.name 
                  ? profile.name.charAt(0).toUpperCase() 
                  : user?.email 
                  ? user.email.charAt(0).toUpperCase() 
                  : "U"
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {profile?.name || profile?.artistic_name || 'Usuário'}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Status e créditos */}
        <div className="flex items-center gap-2">
          <Badge 
            variant={isPro ? "default" : "secondary"} 
            className={cn(
              "text-xs px-2.5 py-1",
              isPro && "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
            )}
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
          <Badge variant="outline" className="text-xs px-2.5 py-1">
            <CreditCard className="h-3 w-3 mr-1" />
            {credits || 0} créditos
          </Badge>
        </div>

        {/* Botão de upgrade ou adicionar créditos */}
        {!isPro ? (
          <Button 
            size="sm" 
            className="w-full mt-3 h-9 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            onClick={() => handleNavigation('/subscription-checkout')}
          >
            <Crown className="h-4 w-4 mr-2" />
            Fazer Upgrade Pro
          </Button>
        ) : (
          <Button 
            size="sm" 
            variant="outline"
            className="w-full mt-3 h-9"
            onClick={() => handleNavigation('/credits-checkout')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Créditos
          </Button>
        )}
      </div>

      {/* Menu de navegação */}
      <div className="flex-1 overflow-y-auto py-3">
        {/* Home */}
        <div className="px-3 mb-2">
          <Button
            variant={isActive('/dashboard') ? "secondary" : "ghost"}
            className={cn(
              'w-full justify-start gap-3 h-11 text-sm font-medium rounded-xl',
              isActive('/dashboard') && 'bg-primary/10 text-primary'
            )}
            onClick={() => handleNavigation('/dashboard')}
          >
            <Home className="h-5 w-5" />
            <span>Início</span>
          </Button>
        </div>

        <div className="px-3 mb-2">
          <Button
            variant={isActive('/dashboard/author-registration') ? "secondary" : "ghost"}
            className={cn(
              'w-full justify-start gap-3 h-11 text-sm font-medium rounded-xl',
              isActive('/dashboard/author-registration') && 'bg-primary/10 text-primary'
            )}
            onClick={() => handleNavigation('/dashboard/author-registration')}
          >
            <ShieldCheck className="h-5 w-5" />
            <span>Registro Autoral</span>
          </Button>
        </div>

        <Separator className="my-3" />

        {/* Seções do menu */}
        {menuSections.map((section) => (
          <div key={section.title} className="mb-4">
            <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {section.title}
            </h4>
            <div className="px-3 space-y-1">
              {section.items.map((item) => (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn(
                    'w-full justify-start gap-3 h-10 text-sm rounded-xl',
                    isActive(item.href) && 'bg-primary/10 text-primary font-medium'
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.isPro && !isPro && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                      Pro
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        ))}

        {/* Admin/Moderador */}
        {(userRole?.role === 'admin' || userRole?.role === 'moderator') && (
          <>
            <Separator className="my-3" />
            <div className="px-3">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-10 text-sm rounded-xl"
                onClick={() => handleNavigation(userRole?.role === 'admin' ? '/admin' : '/moderator')}
              >
                {userRole?.role === 'admin' ? (
                  <>
                    <Settings className="h-4.5 w-4.5" />
                    <span>Painel Admin</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4.5 w-4.5" />
                    <span>Painel Moderador</span>
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1 bg-muted/30">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="flex-1 justify-start gap-2 h-10 text-sm rounded-xl"
            onClick={() => handleNavigation('/dashboard/settings')}
          >
            <Settings className="h-4.5 w-4.5" />
            <span>Configurações</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5" />
            ) : (
              <Moon className="h-4.5 w-4.5" />
            )}
          </Button>
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-10 text-sm rounded-xl"
          onClick={() => {
            window.open('https://wa.me/5519995081355?text=oi%20vim%20pelo%20site%20da%20compuse%2C%20poderia%20me%20ajudar%3F', '_blank');
            onClose();
          }}
        >
          <MessageCircle className="h-4.5 w-4.5" />
          <span>Suporte via WhatsApp</span>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-10 text-sm text-destructive hover:text-destructive rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Sair da conta</span>
        </Button>
      </div>
    </div>
  );
};
