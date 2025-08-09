import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Music, FileText, Award, Coins } from 'lucide-react';
import { getModeratorDashboardStats } from '@/services/moderatorService';

export const ModeratorOverview = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['moderator-dashboard-stats'],
    queryFn: getModeratorDashboardStats,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Erro ao carregar estatísticas:', error);
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard do Moderador</h2>
          <p className="text-muted-foreground">
            Erro ao carregar estatísticas. Exibindo valores padrão.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-destructive">Erro ao carregar dados</div>
                <div className="text-sm text-muted-foreground">
                  Tente recarregar a página
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Usuários Gerenciados',
      value: stats?.total_managed_users || 0,
      icon: Users,
      description: 'Total de usuários criados'
    },
    {
      title: 'Músicas',
      value: stats?.total_managed_songs || 0,
      icon: Music,
      description: 'Músicas dos seus usuários'
    },
    {
      title: 'Rascunhos',
      value: stats?.total_managed_drafts || 0,
      icon: FileText,
      description: 'Rascunhos salvos'
    },
    {
      title: 'Obras Registradas',
      value: stats?.total_managed_registered_works || 0,
      icon: Award,
      description: 'Registros de autoria'
    },
    {
      title: 'Créditos Distribuídos',
      value: stats?.total_credits_distributed || 0,
      icon: Coins,
      description: 'Total de créditos atuais'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard do Moderador</h2>
        <p className="text-muted-foreground">
          Visão geral dos usuários e atividades que você gerencia
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {metricCards.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};