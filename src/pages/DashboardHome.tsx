import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCards } from '@/components/dashboard/StatCards';
import { QuickAccess } from '@/components/dashboard/QuickAccess';
import { AcordesProgress } from '@/components/dashboard/AcordesProgress';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfile } from '@/hooks/useProfile';

const DashboardHome: React.FC = () => {
  const { stats, isLoading, error, refetch } = useDashboardStats();
  const { isPro } = useUserRole();
  const { profile } = useProfile();

  // Dashboard home agora permite scroll por conta do card de acordes
  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Erro ao carregar dados'}</p>
          <Button onClick={() => refetch()}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  const userName = profile?.artistic_name || profile?.name?.split(' ')[0];

  return (
    <div className="h-full overflow-auto flex flex-col max-w-7xl mx-auto pb-4">
      {/* Header com busca e ações */}
      <DashboardHeader userName={userName} />

      {/* Cards de Estatísticas */}
      <div className="mt-2">
        <StatCards stats={stats} isPro={isPro} />
      </div>

      {/* Gamificação - Acordes + Acesso Rápido */}
      <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card de Acordes - 1 coluna */}
        <div className="lg:col-span-1">
          <AcordesProgress />
        </div>
        
        {/* Acesso Rápido - 2 colunas */}
        <div className="lg:col-span-2">
          <QuickAccess isPro={isPro} />
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
