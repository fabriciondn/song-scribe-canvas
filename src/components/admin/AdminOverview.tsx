import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminDashboardStats, getRecentActivity } from '@/services/adminService';
import { Users, FileText, Music, Briefcase, Award, Activity, FolderOpen, File } from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getAdminDashboardStats,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: getRecentActivity,
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats?.totalUsers || 0,
      description: 'Usuários registrados na plataforma',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Usuários Ativos',
      value: stats?.activeUsers || 0,
      description: 'Últimas 24 horas',
      icon: Activity,
      color: 'text-green-600'
    },
    {
      title: 'Total de Músicas',
      value: stats?.totalSongs || 0,
      description: 'Composições finalizadas',
      icon: Music,
      color: 'text-purple-600'
    },
    {
      title: 'Rascunhos',
      value: stats?.totalDrafts || 0,
      description: 'Trabalhos em progresso',
      icon: FileText,
      color: 'text-orange-600'
    },
    {
      title: 'Parcerias',
      value: stats?.totalPartnerships || 0,
      description: 'Colaborações ativas',
      icon: Briefcase,
      color: 'text-indigo-600'
    },
    {
      title: 'Obras Registradas',
      value: stats?.totalRegisteredWorks || 0,
      description: 'Registros de autoria',
      icon: Award,
      color: 'text-yellow-600'
    },
    {
      title: 'Templates',
      value: stats?.totalTemplates || 0,
      description: 'Modelos salvos',
      icon: File,
      color: 'text-teal-600'
    },
    {
      title: 'Pastas',
      value: stats?.totalFolders || 0,
      description: 'Organização de conteúdo',
      icon: FolderOpen,
      color: 'text-cyan-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            Últimas ações realizadas na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity?.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 text-sm">
                  <div className="flex-shrink-0">
                    {activity.type === 'song' && <Music className="h-4 w-4 text-purple-600" />}
                    {activity.type === 'draft' && <FileText className="h-4 w-4 text-orange-600" />}
                    {activity.type === 'partnership' && <Briefcase className="h-4 w-4 text-indigo-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      por {activity.user_name} • {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentActivity || recentActivity.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma atividade recente encontrada
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};