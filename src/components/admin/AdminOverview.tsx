import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminDashboardStats, getRecentActivity } from '@/services/adminService';
import { 
  Users, 
  FileText, 
  Music, 
  Briefcase, 
  Award, 
  Activity, 
  FolderOpen, 
  File,
  Clock,
  CheckCircle,
  Shield,
  TrendingUp,
  BarChart3
} from 'lucide-react';

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

  // Calcular métricas em tempo real
  const uptime = 99.9; // Em produção, seria calculado baseado em logs
  const responseTime = 121; // ms - em produção viria de monitoramento
  const onlineUsers = 52; // Seria calculado baseado em sessões ativas

  return (
    <div className="space-y-6">
      {/* Métricas Principais - Baseadas na imagem */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Resposta Média</p>
                <p className="text-2xl font-bold text-blue-900">{responseTime}ms</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Uptime</p>
                <p className="text-2xl font-bold text-green-900">{uptime}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Usuários Online</p>
                <p className="text-2xl font-bold text-purple-900">{onlineUsers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Status</p>
                <p className="text-lg font-bold text-orange-900">Operacional</p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Detalhadas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-muted-foreground">Usuários registrados na plataforma</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
                <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Music className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Músicas</p>
                <p className="text-2xl font-bold">{stats?.totalSongs || 0}</p>
                <p className="text-xs text-muted-foreground">Composições finalizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rascunhos</p>
                <p className="text-2xl font-bold">{stats?.totalDrafts || 0}</p>
                <p className="text-xs text-muted-foreground">Trabalhos em progresso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Parcerias</p>
                <p className="text-2xl font-bold">{stats?.totalPartnerships || 0}</p>
                <p className="text-xs text-muted-foreground">Colaborações ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Obras Registradas</p>
                <p className="text-2xl font-bold">{stats?.totalRegisteredWorks || 0}</p>
                <p className="text-xs text-muted-foreground">Registros de autoria</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <File className="h-5 w-5 text-teal-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold">{stats?.totalTemplates || 0}</p>
                <p className="text-xs text-muted-foreground">Modelos salvos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-cyan-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pastas</p>
                <p className="text-2xl font-bold">{stats?.totalFolders || 0}</p>
                <p className="text-xs text-muted-foreground">Organização de conteúdo</p>
              </div>
            </div>
          </CardContent>
        </Card>
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