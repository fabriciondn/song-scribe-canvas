import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useAcordes } from '@/hooks/useAcordes';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useTheme } from '@/hooks/useTheme';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Componente para Material Symbols
const MaterialIcon: React.FC<{ name: string; filled?: boolean; className?: string }> = ({ 
  name, 
  filled = false, 
  className = '' 
}) => (
  <span 
    className={`material-symbols-rounded ${filled ? 'filled-icon' : ''} ${className}`}
    style={{ 
      fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
    }}
  >
    {name}
  </span>
);

export const MobileDashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { credits } = useUserCredits();
  const { progress } = useAcordes();
  const { stats } = useDashboardStats();
  const { toggleTheme } = useTheme();

  const userName = profile?.artistic_name || profile?.name?.split(' ')[0] || 'Usuário';
  const userAvatar = profile?.avatar_url;
  const userInitials = userName.substring(0, 2).toUpperCase();
  const totalAcordes = progress?.total_acordes || 0;
  const totalRegistrations = stats?.registeredWorks?.total || 0;
  const totalDrafts = stats?.compositions?.drafts || 0;

  // Dados para o gráfico de barras (simulado por semana)
  const weeklyData = [
    { week: 'Sem 1', value: 4, height: '40%' },
    { week: 'Sem 2', value: 6, height: '60%' },
    { week: 'Sem 3', value: 3, height: '30%' },
    { week: 'Sem 4', value: 8, height: '85%', active: true },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white pb-24 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <header className="pt-12 pb-6 px-6 flex items-center justify-between sticky top-0 z-10 bg-[#000000]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10 border-2 border-[#1E1E1E] shadow-sm">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-[#1E1E1E] text-white text-sm font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00C853] rounded-full border-2 border-[#000000]" />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium">Bem-vindo de volta,</p>
            <h1 className="text-lg font-bold leading-tight">{userName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <MaterialIcon name="dark_mode" className="text-2xl" />
          </button>
          <button 
            onClick={() => navigate('/dashboard/settings')}
            className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <MaterialIcon name="notifications" className="text-2xl" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#000000]" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 space-y-8">
        {/* Card de Créditos */}
        <section>
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            {/* Efeitos de blur */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00C853]/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Saldo disponível</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">{credits || 0}</span>
                    <span className="text-[#00C853] font-bold text-lg">Créditos</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/credits-checkout')}
                  className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all p-2 rounded-xl backdrop-blur-sm border border-white/5"
                >
                  <MaterialIcon name="add" className="text-[#00C853]" />
                </button>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <MaterialIcon name="trending_up" className="text-[#00C853] text-sm" />
                    <span className="text-xs text-gray-300">Recompensas</span>
                  </div>
                  <span className="text-sm font-semibold">{totalAcordes} Acordes</span>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <MaterialIcon name="stars" className="text-yellow-400 text-sm" />
                    <span className="text-xs text-gray-300">Ganhos</span>
                  </div>
                  <span className="text-sm font-semibold">Bônus, +2</span>
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
              className="group flex flex-col items-start p-5 bg-[#1E1E1E] rounded-2xl border border-gray-800 hover:border-[#00C853]/50 transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-[#00C853]/20 flex items-center justify-center mb-4 group-hover:bg-[#00C853] transition-colors text-[#00C853] group-hover:text-white">
                <MaterialIcon name="music_note" filled className="text-2xl" />
              </div>
              <span className="font-bold text-base mb-1">Nova Composição</span>
              <span className="text-xs text-[#9CA3AF] text-left leading-snug">Rascunhe sua próxima ideia</span>
            </button>
            
            <button 
              onClick={() => navigate('/dashboard/author-registration')}
              className="group flex flex-col items-start p-5 bg-[#1E1E1E] rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors text-blue-400 group-hover:text-white">
                <MaterialIcon name="copyright" filled className="text-2xl" />
              </div>
              <span className="font-bold text-base mb-1">Registrar Obra</span>
              <span className="text-xs text-[#9CA3AF] text-left leading-snug">Proteja seus direitos</span>
            </button>
          </div>
        </section>

        {/* Resumo Mensal */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Resumo Mensal</h2>
            <button 
              onClick={() => navigate('/dashboard/registered-works')}
              className="text-[#00C853] text-sm font-semibold hover:underline"
            >
              Ver tudo
            </button>
          </div>
          
          <div className="bg-[#1E1E1E] rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <span className="text-3xl font-bold">{totalRegistrations}</span>
                <span className="text-xs text-[#9CA3AF] uppercase tracking-wide font-semibold">Total de Registros</span>
              </div>
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-900/30 text-green-400">
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
                      ? 'bg-[#00C853] shadow-[0_0_10px_rgba(0,200,83,0.3)]' 
                      : 'bg-gray-800 hover:bg-[#00C853]/20'
                  }`}
                  style={{ height: item.height }}
                >
                  <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1E1E1E] border border-gray-700 text-white text-[10px] py-1 px-2 rounded font-bold ${
                    item.active ? 'block' : 'hidden group-hover:block'
                  }`}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-[#9CA3AF] font-medium">
              {weeklyData.map((item, index) => (
                <span key={index} className={item.active ? 'text-[#00C853] font-bold' : ''}>
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
              className="w-full flex items-center p-3 bg-[#1E1E1E] rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-orange-900/30 flex items-center justify-center text-orange-400 mr-3 flex-shrink-0">
                <MaterialIcon name="folder_open" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h4 className="font-semibold text-sm truncate">Meus Rascunhos</h4>
                <p className="text-xs text-[#9CA3AF]">{totalDrafts} rascunhos salvos</p>
              </div>
              <MaterialIcon name="chevron_right" className="text-gray-600" />
            </button>
            
            <button 
              onClick={() => navigate('/dashboard/registered-works')}
              className="w-full flex items-center p-3 bg-[#1E1E1E] rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#00C853]/20 flex items-center justify-center text-[#00C853] mr-3 flex-shrink-0">
                <MaterialIcon name="check_circle" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h4 className="font-semibold text-sm truncate">Obras Registradas</h4>
                <p className="text-xs text-[#9CA3AF]">{totalRegistrations} músicas protegidas</p>
              </div>
              <span className="text-xs font-bold text-[#00C853] bg-[#00C853]/10 px-2 py-1 rounded">Novo</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
