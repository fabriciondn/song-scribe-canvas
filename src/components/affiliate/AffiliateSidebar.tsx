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
    <aside className="w-64 bg-black border-r border-white/10 fixed left-0 top-0 bottom-0 flex flex-col">
      {/* Logo Section */}
      <div className="pt-4 pb-3 px-4 flex justify-center border-b border-white/10">
        <img 
          src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
          alt="Compuse Logo" 
          className="h-8"
        />
      </div>

      {/* Profile Section */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex flex-col items-center">
          <Avatar className="w-16 h-16 mb-2">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-base bg-white/10 text-white">
              {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-center text-sm text-white">{profile?.name || 'Parceiro'}</h3>
          <div className="flex items-center gap-1 mt-1">
            {getLevelBadge()}
            <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-700 text-xs">
              Ativo
            </Badge>
          </div>
        </div>
      </div>

      {/* Menu Items - Scrollable */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-white text-black' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle - Fixed Footer */}
      <div className="border-t border-white/10 p-4 space-y-2">
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

        {/* Back to Dashboard Button */}
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
  );
}
