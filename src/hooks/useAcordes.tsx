import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useImpersonation } from '@/context/ImpersonationContext';
import { getUserAcordesProgress, redeemAcordes, UserAcordesProgress } from '@/services/acordeService';
import { toast } from 'sonner';

export const useAcordes = () => {
  const { user } = useContext(AuthContext);
  const { impersonatedUser, isImpersonating } = useImpersonation();
  const [progress, setProgress] = useState<UserAcordesProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const currentUserId = isImpersonating ? impersonatedUser?.id : user?.id;

  const fetchProgress = useCallback(async () => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getUserAcordesProgress(currentUserId);
      setProgress(data);
    } catch (error) {
      console.error('Error fetching acordes progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const handleRedeem = useCallback(async () => {
    if (!currentUserId || !progress?.can_redeem) return;

    setIsRedeeming(true);
    try {
      const result = await redeemAcordes(currentUserId);
      
      if (result.success) {
        toast.success(result.message);
        // Disparar evento para atualizar créditos no header
        window.dispatchEvent(new CustomEvent('credits-updated'));
        // Recarregar progresso
        await fetchProgress();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error redeeming acordes:', error);
      toast.error('Erro ao resgatar acordes');
    } finally {
      setIsRedeeming(false);
    }
  }, [currentUserId, progress?.can_redeem, fetchProgress]);

  return {
    progress,
    isLoading,
    isRedeeming,
    refreshProgress: fetchProgress,
    redeemAcordes: handleRedeem
  };
};
