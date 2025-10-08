import { 
  Home, 
  Link as LinkIcon, 
  BarChart3, 
  DollarSign, 
  Wallet, 
  Trophy,
  ChevronLeft,
  Sun,
  Moon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';

interface AffiliateSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  affiliate: {
    level: string;
    status: string;
  };
}

export function AffiliateSidebar({ activeSection, onSectionChange, affiliate }: AffiliateSidebarProps) {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { theme, toggleTheme } = useTheme();

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
      <Badge className={`${levelInfo.color} text-white`}>
        {levelInfo.label}
      </Badge>
    );
  };

  return (
    <aside className="w-64 bg-card border-r min-h-screen p-4 flex flex-col">
      {/* Logo Section */}
      <div className="mb-4 flex justify-center">
        <img 
          src={theme === 'dark' ? "/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" : "/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"}
          alt="Compuse Logo" 
          className="h-8"
        />
      </div>

      {/* Profile Section */}
      <div className="mb-4">
        <div className="flex flex-col items-center">
          <Avatar className="w-16 h-16 mb-2">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-base">
              {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-center text-sm">{profile?.name || 'Afiliado'}</h3>
          <div className="flex items-center gap-1 mt-1">
            {getLevelBadge()}
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              Ativo
            </Badge>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="border-t pt-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
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

        {/* Back to Dashboard Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/dashboard')}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>
    </aside>
  );
}
