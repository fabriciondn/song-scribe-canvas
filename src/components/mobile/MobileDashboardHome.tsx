import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useSubscriptionCredits } from '@/hooks/useSubscriptionCredits';
import { useAcordes } from '@/hooks/useAcordes';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useWeeklyRegistrations } from '@/hooks/useWeeklyRegistrations';
import { useTheme } from '@/hooks/useTheme';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MobileNotificationCenter } from './MobileNotificationCenter';

// Componente para Material Symbols
const MaterialIcon: React.FC<{ name: string; filled?: boolean; className?: string }> = ({ 
  name, 
  filled = false, 
  className = '' 
}) => (
  <span 
    className={`material-symbols-rounded ${className}`}
    style={{ 
      fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
    }}
  >
    {name}
  </span>
);

export const MobileDashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { credits } = useUserCredits();
  const { bonusCredits, isFrozen } = useSubscriptionCredits();
  const { progress } = useAcordes();
  const { stats } = useDashboardStats();
  const { weeklyData } = useWeeklyRegistrations();
  const { theme, toggleTheme } = useTheme();

  const userName = profile?.artistic_name || profile?.name?.split(' ')[0] || 'Usuário';
  const userAvatar = profile?.avatar_url;
  const userInitials = userName.substring(0, 2).toUpperCase();
  const totalAcordes = progress?.total_acordes || 0;
  const totalRegistrations = stats?.registeredWorks?.total || 0;
  const totalDrafts = stats?.compositions?.drafts || 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <header className="pt-12 pb-6 px-6 flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10 border-2 border-border shadow-sm">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Bem-vindo de volta,</p>
            <h1 className="text-lg font-bold leading-tight">{userName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-accent transition-colors"
          >
            <MaterialIcon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} className="text-2xl" />
          </button>
          {/* Notificações da plataforma */}
          <MobileNotificationCenter />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 space-y-8">
        {/* Card de Créditos */}
        <section>
          <div className="bg-gradient-to-br from-card to-background rounded-3xl p-6 shadow-xl relative overflow-hidden border border-border">
            {/* Efeitos de blur */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">Saldo disponível</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">{credits || 0}</span>
                    <span className="text-primary font-bold text-lg">Créditos</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/credits-checkout')}
                  className="bg-accent hover:bg-accent/80 active:scale-95 transition-all p-2 rounded-xl backdrop-blur-sm border border-border"
                >
                  <MaterialIcon name="add" className="text-primary" />
                </button>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => navigate('/dashboard/acordes')}
                  className="flex-1 bg-accent/50 rounded-xl p-3 border border-border hover:bg-accent active:scale-[0.98] transition-all text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MaterialIcon name="trending_up" className="text-primary text-sm" />
                    <span className="text-xs text-muted-foreground">Recompensas</span>
                  </div>
                  <span className="text-sm font-semibold">{totalAcordes} Acordes</span>
                </button>
                <div className="flex-1 bg-accent/50 rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <MaterialIcon name={isFrozen ? "ac_unit" : "stars"} className={isFrozen ? "text-blue-400 text-sm" : "text-yellow-400 text-sm"} />
                    <span className="text-xs text-muted-foreground">{isFrozen ? 'Congelados' : 'Bônus'}</span>
                  </div>
                  <span className="text-sm font-semibold">{bonusCredits} Bônus</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ações Rápidas */}
        <section>
          <h2 className="text-lg font-bold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/dashboard/composer')}
              className="group flex flex-col items-start p-5 bg-card rounded-2xl border border-border hover:border-primary/50 transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors text-primary group-hover:text-primary-foreground">
                <MaterialIcon name="music_note" filled className="text-2xl" />
              </div>
              <span className="font-bold text-base mb-1">Nova Composição</span>
              <span className="text-xs text-muted-foreground text-left leading-snug">Rascunhe sua próxima ideia</span>
            </button>
            
            <button 
              onClick={() => navigate('/dashboard/author-registration')}
              className="group flex flex-col items-start p-5 bg-card rounded-2xl border border-border hover:border-blue-500/50 transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors text-blue-400 group-hover:text-white">
                <MaterialIcon name="copyright" filled className="text-2xl" />
              </div>
              <span className="font-bold text-base mb-1">Registrar Obra</span>
              <span className="text-xs text-muted-foreground text-left leading-snug">Proteja seus direitos</span>
            </button>
          </div>
        </section>

        {/* Resumo Mensal */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Resumo Mensal</h2>
            <button 
              onClick={() => navigate('/dashboard/registered-works')}
              className="text-primary text-sm font-semibold hover:underline"
            >
              Ver tudo
            </button>
          </div>
          
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <span className="text-3xl font-bold">{totalRegistrations}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Total de Registros</span>
              </div>
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/20 text-primary">
                <MaterialIcon name="bar_chart" />
              </div>
            </div>
            
            {/* Gráfico de barras */}
            <div className="flex items-end gap-2 h-24 w-full">
              {weeklyData.map((item, index) => (
                <div 
                  key={index}
                  className={`w-full rounded-t-md relative group cursor-pointer transition-colors ${
                    item.active 
                      ? 'bg-primary shadow-[0_0_10px_rgba(0,200,83,0.3)]' 
                      : 'bg-muted hover:bg-primary/20'
                  }`}
                  style={{ height: item.height }}
                >
                  <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border text-foreground text-[10px] py-1 px-2 rounded font-bold ${
                    item.active ? 'block' : 'hidden group-hover:block'
                  }`}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
              {weeklyData.map((item, index) => (
                <span key={index} className={item.active ? 'text-primary font-bold' : ''}>
                  {item.week}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Atividade Recente */}
        <section>
          <h2 className="text-lg font-bold mb-4">Atividade Recente</h2>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/dashboard/drafts')}
              className="w-full flex items-center p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 mr-3 flex-shrink-0">
                <MaterialIcon name="folder_open" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h4 className="font-semibold text-sm truncate">Meus Rascunhos</h4>
                <p className="text-xs text-muted-foreground">{totalDrafts} rascunhos salvos</p>
              </div>
              <MaterialIcon name="chevron_right" className="text-muted-foreground" />
            </button>
            
            <button 
              onClick={() => navigate('/dashboard/registered-works')}
              className="w-full flex items-center p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-3 flex-shrink-0">
                <MaterialIcon name="check_circle" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h4 className="font-semibold text-sm truncate">Obras Registradas</h4>
                <p className="text-xs text-muted-foreground">{totalRegistrations} músicas protegidas</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Novo</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
