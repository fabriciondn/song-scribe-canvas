
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, DashboardStats } from '@/services/dashboardService';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export const useDashboardStats = () => {
  const user = useCurrentUser();
  const userId = user?.id;
  const {
    data: stats,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard-stats', userId],
    queryFn: () => userId ? getDashboardStats(userId) : Promise.reject('No user'),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    stats: stats || null,
    isLoading,
    error: error ? 'Erro ao carregar estatísticas do dashboard' : null,
    refetch
  };
};
