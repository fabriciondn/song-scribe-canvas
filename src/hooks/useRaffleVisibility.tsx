import { useQuery } from '@tanstack/react-query';
import { raffleService } from '@/services/raffleService';

export const useRaffleVisibility = () => {
  const { data: isVisible, isLoading } = useQuery({
    queryKey: ['raffle-visibility'],
    queryFn: raffleService.isRaffleVisibleInMenu,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    isRaffleVisible: isVisible ?? false,
    isLoading
  };
};
