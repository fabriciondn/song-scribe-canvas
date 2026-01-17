import React, { useContext } from 'react';
import { CreditCard, Wallet, Moon, Sun, Music, ChevronRight, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { NotificationCenter } from './NotificationCenter';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useTheme } from '@/hooks/useTheme';
import { useAcordes } from '@/hooks/useAcordes';
import { AuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';


interface DashboardHeaderProps {
  userName?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
  const { credits } = useUserCredits();
  const { theme, toggleTheme } = useTheme();
  const { progress } = useAcordes();
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Você saiu da plataforma');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao sair');
    }
  };

  const nextObjective = progress?.available_actions?.find(a => a.can_complete);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
          {userName ? `Olá, ${userName}` : 'Bem-vindo'}
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
          Gerencie suas composições e obras
        </p>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full">
          <CreditCard className="h-4 w-4" />
          {credits || 0} créditos
        </Badge>

        {nextObjective && (
          <Badge 
            variant="outline" 
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer hover:bg-purple-500/10 border-purple-500/30 text-purple-400 rounded-full transition-colors"
            onClick={() => navigate('/dashboard/acordes')}
          >
            <Music className="h-4 w-4" />
            <span>{progress?.available_acordes}/20</span>
            <ChevronRight className="h-3 w-3" />
          </Badge>
        )}
        
        <Button asChild size="sm" className="gap-1.5 sm:gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25 h-9 sm:h-10 px-3 sm:px-4 rounded-full">
          <Link to="/dashboard/credits-checkout">
            <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Adicionar</span>
          </Link>
        </Button>
        
        <NotificationCenter />
        
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleLogout} 
          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Sair da plataforma"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
