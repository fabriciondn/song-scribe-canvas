
import React from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { Music, Users, Shield, Folder, TrendingUp } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDashboardCardSelection } from "@/hooks/useDashboardCardSelection";
import { ModernWelcomeSection } from "@/components/dashboard/modern/ModernWelcomeSection";
import { ModernMetricCard } from "@/components/dashboard/modern/ModernMetricCard";
import { QuickActions } from "@/components/dashboard/modern/QuickActions";
import { ModernFeatureCarousel } from "@/components/dashboard/modern/ModernFeatureCarousel";
import { GlassCard } from "@/components/dashboard/modern/GlassCard";

const DashboardHome = () => {
  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { expandedSections, toggleSection, isExpanded } = useDashboardCardSelection();

  const handleToggleSection = toggleSection;

  const renderLoadingGrid = () => (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassCard key={i} className="animate-pulse">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-foreground/10 rounded w-1/2"></div>
                <div className="h-8 bg-foreground/10 rounded w-3/4"></div>
                <div className="h-3 bg-foreground/10 rounded w-full"></div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl"></div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );

  const renderErrorState = () => (
    <GlassCard className="col-span-full">
      <div className="text-center py-8">
        <TrendingUp className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
        <p className="text-foreground/70 text-lg">Erro ao carregar estatísticas</p>
        <p className="text-foreground/50 text-sm mt-2">Tente atualizar a página</p>
      </div>
    </GlassCard>
  );

  const renderStatsGrid = () => (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <ModernMetricCard
        title="Composições"
        value={stats?.compositions?.total || 0}
        icon={Music}
        description="Total de obras criadas"
        gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        progress={stats?.compositions?.total ? Math.min((stats.compositions.total / 100) * 100, 100) : 0}
        trend={stats?.compositions?.total > 0 ? 'up' : 'neutral'}
      />
      
      <ModernMetricCard
        title="Parcerias"
        value={stats?.partnerships?.active || 0}
        icon={Users}
        description="Colaborações ativas"
        gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        progress={stats?.partnerships?.active ? Math.min((stats.partnerships.active / 20) * 100, 100) : 0}
        trend={stats?.partnerships?.active > 0 ? 'up' : 'neutral'}
      />
      
      <ModernMetricCard
        title="Obras Registradas"
        value={stats?.registeredWorks?.total || 0}
        icon={Shield}
        description="Registros autorais"
        gradient="bg-gradient-to-br from-green-500 to-green-600"
        progress={stats?.registeredWorks?.total ? Math.min((stats.registeredWorks.total / 50) * 100, 100) : 0}
        trend={stats?.registeredWorks?.total > 0 ? 'up' : 'neutral'}
      />
      
      <ModernMetricCard
        title="Pastas"
        value={stats?.folders?.total || 0}
        icon={Folder}
        description="Organização de conteúdo"
        gradient="bg-gradient-to-br from-orange-500 to-orange-600"
        progress={stats?.folders?.total ? Math.min((stats.folders.total / 10) * 100, 100) : 0}
        trend={stats?.folders?.total > 0 ? 'up' : 'neutral'}
      />
    </div>
  );

  return (
    <NextUIProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Header fixo com carousel */}
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50">
          <div className="h-20 flex items-center justify-center px-4">
            <ModernFeatureCarousel />
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="px-4 md:px-8 py-8 space-y-8">
          {/* Seção de boas-vindas moderna */}
          <div className="max-w-7xl mx-auto">
            <ModernWelcomeSection 
              expandedSections={expandedSections} 
              onToggleSection={handleToggleSection} 
            />
          </div>

          {/* Grid de métricas */}
          <div className="max-w-7xl mx-auto">
            {statsLoading ? renderLoadingGrid() : statsError ? renderErrorState() : renderStatsGrid()}
          </div>

          {/* Seção de ações rápidas */}
          <div className="max-w-7xl mx-auto">
            <QuickActions />
          </div>

          {/* Seção adicional para futura expansão */}
          <div className="max-w-7xl mx-auto">
            <GlassCard>
              <div className="text-center py-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-4">
                  <Music className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Seu estúdio criativo awaits
                </h3>
                <p className="text-foreground/70 max-w-md mx-auto">
                  Explore todas as ferramentas disponíveis para dar vida às suas ideias musicais
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </NextUIProvider>
  );
};

export default DashboardHome;
