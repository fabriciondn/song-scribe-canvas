import { 
  Home, 
  Link as LinkIcon, 
  BarChart3, 
  DollarSign, 
  Wallet, 
  Trophy,
  ChevronLeft
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';

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
      {/* Profile Section */}
      <div className="mb-6">
        <div className="flex flex-col items-center mb-4">
          <Avatar className="w-20 h-20 mb-3">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-lg">
              {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-center">{profile?.name || 'Afiliado'}</h3>
          <div className="flex items-center gap-2 mt-2">
            {getLevelBadge()}
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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

      {/* Back to Dashboard Button */}
      <Button
        variant="outline"
        className="w-full mt-4"
        onClick={() => navigate('/dashboard')}
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Voltar ao Dashboard
      </Button>
    </aside>
  );
}
