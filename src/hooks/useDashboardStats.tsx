
import { useState, useEffect } from 'react';
import { getDashboardStats, DashboardStats } from '@/services/dashboardService';
import { useAuth } from '@/hooks/useAuth';

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Erro ao carregar estatísticas do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    loadStats();
  };

  return {
    stats,
    isLoading,
    error,
    refetch
  };
};
