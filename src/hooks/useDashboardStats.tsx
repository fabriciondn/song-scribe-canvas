
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDashboardStats } from '@/services/dashboardService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthorRegistrationsRealtimeUpdates, useDraftsRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

export const useDashboardStats = () => {
  const user = useCurrentUser();
  const userId = user?.id;
  const queryClient = useQueryClient();

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

  // Escuta atualizações em tempo real para registros de autor
  useAuthorRegistrationsRealtimeUpdates(() => {
    console.log('🔄 Atualizando estatísticas do dashboard devido a mudança em author_registrations');
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats', userId] });
  });

  // Escuta atualizações em tempo real para rascunhos
  useDraftsRealtimeUpdates(() => {
    console.log('🔄 Atualizando estatísticas do dashboard devido a mudança em drafts');
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats', userId] });
  });

  return {
    stats: stats || null,
    isLoading,
    error: error ? 'Erro ao carregar estatísticas do dashboard' : null,
    refetch
  };
};
