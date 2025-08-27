
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Music, FileText, Award, Coins, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getModeratorDashboardStats } from '@/services/moderatorService';

export const ModeratorOverview = () => {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['moderator-dashboard-stats'],
    queryFn: getModeratorDashboardStats,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000, // 30 segundos para dados mais atualizados
    refetchInterval: 60 * 1000, // Atualizar a cada 1 minuto
  });

  console.log('📊 ModeratorOverview - Stats:', { stats, isLoading, error });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard do Moderador</h2>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard do Moderador</h2>
            <p className="text-muted-foreground text-destructive">
              Erro ao carregar estatísticas: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-destructive mb-2">Não foi possível carregar os dados</div>
              <div className="text-sm text-muted-foreground">
                Verifique sua conexão e tente novamente
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Garantir que temos dados válidos ou usar zeros
  const safeStats = {
    total_managed_users: stats?.total_managed_users || 0,
    total_managed_songs: stats?.total_managed_songs || 0,
    total_managed_drafts: stats?.total_managed_drafts || 0,
    total_managed_registered_works: stats?.total_managed_registered_works || 0,
    total_credits_distributed: stats?.total_credits_distributed || 0,
  };

  const metricCards = [
    {
      title: 'Usuários Gerenciados',
      value: safeStats.total_managed_users,
      icon: Users,
      description: 'Total de usuários criados por você'
    },
    {
      title: 'Músicas',
      value: safeStats.total_managed_songs,
      icon: Music,
      description: 'Músicas dos seus usuários'
    },
    {
      title: 'Rascunhos',
      value: safeStats.total_managed_drafts,
      icon: FileText,
      description: 'Rascunhos salvos pelos usuários'
    },
    {
      title: 'Obras Registradas',
      value: safeStats.total_managed_registered_works,
      icon: Award,
      description: 'Registros de autoria concluídos'
    },
    {
      title: 'Créditos Atuais',
      value: safeStats.total_credits_distributed,
      icon: Coins,
      description: 'Soma dos créditos atuais dos usuários'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard do Moderador</h2>
          <p className="text-muted-foreground">
            Visão geral dos usuários e atividades que você gerencia
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
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

      {/* Informações Adicionais */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Atividade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Usuários Ativos:</span>
                <span className="text-sm font-medium">{safeStats.total_managed_users}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Conteúdo Total:</span>
                <span className="text-sm font-medium">
                  {safeStats.total_managed_songs + safeStats.total_managed_drafts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Obras Registradas:</span>
                <span className="text-sm font-medium">{safeStats.total_managed_registered_works}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Créditos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Créditos Distribuídos:</span>
                <span className="text-sm font-medium">{safeStats.total_credits_distributed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Média por Usuário:</span>
                <span className="text-sm font-medium">
                  {safeStats.total_managed_users > 0 
                    ? Math.round(safeStats.total_credits_distributed / safeStats.total_managed_users)
                    : 0
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
