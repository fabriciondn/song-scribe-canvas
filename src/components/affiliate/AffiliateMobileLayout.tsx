import { useState } from 'react';
import { 
  Home, 
  Link as LinkIcon, 
  BarChart3, 
  DollarSign, 
  Wallet, 
  Trophy,
  ChevronLeft,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface AffiliateMobileLayoutProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  affiliate: {
    level: string;
    status: string;
  };
  children: React.ReactNode;
}

export function AffiliateMobileLayout({ 
  activeSection, 
  onSectionChange, 
  affiliate,
  children 
}: AffiliateMobileLayoutProps) {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Visão Geral', icon: Home },
    { id: 'links', label: 'Links', icon: LinkIcon },
    { id: 'campaigns', label: 'Campanhas', icon: BarChart3 },
    { id: 'commissions', label: 'Comissões', icon: DollarSign },
    { id: 'withdrawals', label: 'Saques', icon: Wallet },
    { id: 'achievements', label: 'Conquistas', icon: Trophy }
  ];

  const getLevelBadge = () => {
    const levels: Record<string, { color: string; label: string }> = {
      bronze: { color: 'bg-orange-500', label: 'BRONZE' },
      silver: { color: 'bg-gray-400', label: 'SILVER' },
      gold: { color: 'bg-yellow-500', label: 'GOLD' }
    };
    
    const levelInfo = levels[affiliate.level] || levels.bronze;
    
    return (
      <Badge className={`${levelInfo.color} text-white text-xs`}>
        {levelInfo.label}
      </Badge>
    );
  };

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <header className="bg-black border-b border-white/10 sticky top-0 z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white p-2 -ml-2"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <img 
            src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
            alt="Compuse Logo" 
            className="h-7"
          />
          
          <Avatar className="w-8 h-8">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-white/10 text-white">
              {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Slide-out Menu */}
      <div 
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-300",
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMenuOpen(false)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      </div>

      <aside 
        className={cn(
          "fixed left-0 top-0 bottom-0 w-72 bg-black border-r border-white/10 z-50 transform transition-transform duration-300 flex flex-col",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Section */}
        <div className="pt-6 pb-4 px-4 flex justify-center border-b border-white/10">
          <img 
            src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
            alt="Compuse Logo" 
            className="h-8"
          />
        </div>

        {/* Profile Section */}
        <div className="px-4 py-6 border-b border-white/10">
          <div className="flex flex-col items-center">
            <Avatar className="w-20 h-20 mb-3">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-white/10 text-white">
                {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-center text-white">{profile?.name || 'Afiliado'}</h3>
            <div className="flex items-center gap-2 mt-2">
              {getLevelBadge()}
              <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-700 text-xs">
                Ativo
              </Badge>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive 
                    ? 'bg-white text-black' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-white/10 p-4 space-y-2 safe-area-bottom">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-5 h-5 mr-3" />
                <span className="font-medium">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 mr-3" />
                <span className="font-medium">Modo Escuro</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
            onClick={() => navigate('/dashboard')}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-safe">
        <div className="px-4 py-4">
          {children}
        </div>
      </main>
    </div>
  );
}
