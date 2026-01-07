import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useImpersonation } from '@/context/ImpersonationContext';
import { supabase } from '@/integrations/supabase/client';

interface WeeklyData {
  week: string;
  value: number;
  height: string;
  active?: boolean;
}

export const useWeeklyRegistrations = () => {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = useMemo(() => 
    isImpersonating && impersonatedUser ? impersonatedUser.id : user?.id,
    [isImpersonating, impersonatedUser?.id, user?.id]
  );

  useEffect(() => {
    const fetchWeeklyData = async () => {
      if (!currentUserId) {
        setWeeklyData([
          { week: 'Sem 1', value: 0, height: '5%' },
          { week: 'Sem 2', value: 0, height: '5%' },
          { week: 'Sem 3', value: 0, height: '5%' },
          { week: 'Sem 4', value: 0, height: '5%', active: true },
        ]);
        setIsLoading(false);
        return;
      }

      try {
        // Buscar primeiro e último dia do mês atual
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const { data, error } = await supabase
          .from('author_registrations')
          .select('created_at')
          .eq('user_id', currentUserId)
          .in('status', ['registered', 'completed'])
          .gte('created_at', firstDayOfMonth.toISOString())
          .lte('created_at', lastDayOfMonth.toISOString());

        if (error) {
          console.error('Error fetching weekly registrations:', error);
          setWeeklyData([
            { week: 'Sem 1', value: 0, height: '5%' },
            { week: 'Sem 2', value: 0, height: '5%' },
            { week: 'Sem 3', value: 0, height: '5%' },
            { week: 'Sem 4', value: 0, height: '5%', active: true },
          ]);
          setIsLoading(false);
          return;
        }

        // Calcular semana de cada registro
        const weekCounts = [0, 0, 0, 0];
        
        data?.forEach((registration) => {
          const date = new Date(registration.created_at);
          const dayOfMonth = date.getDate();
          
          // Determinar semana do mês (1-7 = sem1, 8-14 = sem2, 15-21 = sem3, 22+ = sem4)
          let weekIndex = 0;
          if (dayOfMonth <= 7) weekIndex = 0;
          else if (dayOfMonth <= 14) weekIndex = 1;
          else if (dayOfMonth <= 21) weekIndex = 2;
          else weekIndex = 3;
          
          weekCounts[weekIndex]++;
        });

        // Determinar qual semana é a atual
        const currentDay = now.getDate();
        let currentWeekIndex = 0;
        if (currentDay <= 7) currentWeekIndex = 0;
        else if (currentDay <= 14) currentWeekIndex = 1;
        else if (currentDay <= 21) currentWeekIndex = 2;
        else currentWeekIndex = 3;

        // Calcular altura proporcional (máximo = 100%)
        const maxValue = Math.max(...weekCounts, 1);
        
        const formattedData: WeeklyData[] = weekCounts.map((count, index) => ({
          week: `Sem ${index + 1}`,
          value: count,
          height: `${Math.max((count / maxValue) * 100, 5)}%`,
          active: index === currentWeekIndex,
        }));

        setWeeklyData(formattedData);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeklyData();
  }, [currentUserId]);

  return { weeklyData, isLoading };
};
