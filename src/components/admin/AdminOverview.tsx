import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { getAdminDashboardStats } from '@/services/adminService';
import { 
  Users, 
  Shield,
  BarChart3
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getAdminDashboardStats,
    refetchInterval: 5000,
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">Via Mercado Pago</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};