import React from 'react';
import { Button } from '@/components/ui/button';
import FeatureCarousel from '@/components/dashboard/FeatureCarousel';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCards } from '@/components/dashboard/StatCards';
import { QuickAccess } from '@/components/dashboard/QuickAccess';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useMobileDetection } from '@/hooks/use-mobile';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfile } from '@/hooks/useProfile';

const DashboardHome: React.FC = () => {
  const { stats, isLoading, error, refetch } = useDashboardStats();
  const { isMobile } = useMobileDetection();
  const { isPro } = useUserRole();
  const { profile } = useProfile();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || 'Erro ao carregar dados'}</p>
            <Button onClick={() => refetch()}>Tentar Novamente</Button>
          </div>
        </div>
      </div>
    );
  }

  const userName = profile?.artistic_name || profile?.name?.split(' ')[0];

  return (
    <div className="container mx-auto pt-2 space-y-6">
      {/* Banner Carousel - Apenas Desktop */}
      {!isMobile && (
        <div className="sticky top-0 z-10 bg-background pb-4 -mx-6 px-6">
          <FeatureCarousel />
        </div>
      )}

      {/* Header com busca e ações */}
      <DashboardHeader userName={userName} />

      {/* Cards de Estatísticas */}
      <StatCards stats={stats} isPro={isPro} />

      {/* Acesso Rápido */}
      <QuickAccess isPro={isPro} />

      {/* Atividade Recente */}
      <RecentActivity />
    </div>
  );
};

export default DashboardHome;
