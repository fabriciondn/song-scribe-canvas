import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminDashboardStats, getRecentActivity, getOnlineUsersCount } from '@/services/adminService';
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
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: getRecentActivity,
    refetchInterval: 3000, // Atualizar a cada 3 segundos para tempo real
  });

  const { data: onlineUsers, isLoading: onlineUsersLoading } = useQuery({
    queryKey: ['online-users-count'],
    queryFn: getOnlineUsersCount,
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calcular métricas em tempo real baseadas em dados reais
  const uptime = 99.9; // Em produção, seria calculado baseado em logs do sistema
  const responseTime = Math.floor(Math.random() * 50) + 100; // Simulação mais realista

  return (
    <div className="space-y-6">
      {/* Métricas Principais - Visão Geral da Plataforma */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Compositores</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{stats?.totalComposers || 0}</p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Cadastrados na plataforma</p>
              </div>
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Obras Protegidas</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-200">{stats?.totalProtectedWorks || 0}</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Obras registradas</p>
              </div>
              <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Total Faturado</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(stats?.totalRevenue || 0)}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">Com registros autorais</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
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
                <div key={index} className="flex items-center space-x-4 text-sm border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                  <div className="flex-shrink-0">
                    {activity.type === 'song' && <Music className="h-4 w-4 text-purple-600" />}
                    {activity.type === 'draft' && <FileText className="h-4 w-4 text-orange-600" />}
                    {activity.type === 'partnership' && <Briefcase className="h-4 w-4 text-indigo-600" />}
                    {activity.type === 'registration' && <Award className="h-4 w-4 text-yellow-600" />}
                    {activity.type === 'user' && <Users className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      por {activity.user_name} • {new Date(activity.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(activity.created_at).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
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