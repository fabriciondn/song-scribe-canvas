import React from 'react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCards } from '@/components/dashboard/StatCards';
import { QuickAccess } from '@/components/dashboard/QuickAccess';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfile } from '@/hooks/useProfile';

const DashboardHome: React.FC = () => {
  const { stats, isLoading, error, refetch } = useDashboardStats();
  const { isPro } = useUserRole();
  const { profile } = useProfile();

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
    <div className="h-full overflow-hidden flex flex-col px-4 sm:px-6 py-3 max-w-7xl mx-auto">
      {/* Header com busca e ações */}
      <DashboardHeader userName={userName} />

      {/* Cards de Estatísticas */}
      <div className="mt-3">
        <StatCards stats={stats} isPro={isPro} />
      </div>

      {/* Acesso Rápido */}
      <div className="mt-4">
        <QuickAccess isPro={isPro} />
      </div>
    </div>
  );
};

export default DashboardHome;
