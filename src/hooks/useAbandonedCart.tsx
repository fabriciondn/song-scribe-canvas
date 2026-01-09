import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PendingPixData {
  pixData: {
    qr_code: string;
    qr_code_url: string;
    payment_id: string;
  };
  credits: number;
  bonusCredits: number;
  totalAmount: number;
  createdAt: string;
  transactionId: string;
}

const PIX_EXPIRATION_MINUTES = 30;
const STORAGE_KEY = 'pending_pix_payment';

export const useAbandonedCart = () => {
  const { user } = useAuth();
  const [pendingData, setPendingData] = useState<PendingPixData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isPixExpired = useCallback((createdAt: string): boolean => {
    const createdTime = new Date(createdAt).getTime();
    const now = Date.now();
    const diffMinutes = (now - createdTime) / (1000 * 60);
    return diffMinutes >= PIX_EXPIRATION_MINUTES;
  }, []);

  const getTimeRemaining = useCallback((createdAt: string): number => {
    const createdTime = new Date(createdAt).getTime();
    const expirationTime = createdTime + (PIX_EXPIRATION_MINUTES * 60 * 1000);
    const remaining = expirationTime - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }, []);

  const checkPendingPayment = useCallback(async () => {
    if (!user?.id) {
      setPendingData(null);
      setIsLoading(false);
      return;
    }

    try {
      // Primeiro, verificar localStorage
      const storedData = localStorage.getItem(STORAGE_KEY);
      
      if (storedData) {
        const parsed: PendingPixData = JSON.parse(storedData);
        
        // Verificar se o pagamento ainda está pendente no banco
        const { data: transaction } = await supabase
          .from('credit_transactions')
          .select('status, created_at')
          .eq('id', parsed.transactionId)
          .eq('user_id', user.id)
          .single();

        if (transaction?.status === 'pending') {
          // Verificar se não está expirado
          if (!isPixExpired(parsed.createdAt)) {
            setPendingData(parsed);
          } else {
            // PIX expirado, mas ainda pendente - manter dados para regenerar
            setPendingData({ ...parsed, pixData: { ...parsed.pixData, qr_code: '', qr_code_url: '' } });
          }
        } else {
          // Transação não está mais pendente, limpar
          localStorage.removeItem(STORAGE_KEY);
          setPendingData(null);
        }
      } else {
        // Verificar se há transação pendente no banco sem dados no localStorage
        const { data: pendingTransaction } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (pendingTransaction) {
          // Há uma transação pendente mas sem dados de PIX salvos localmente
          // O usuário terá que gerar um novo PIX
          setPendingData({
            pixData: { qr_code: '', qr_code_url: '', payment_id: pendingTransaction.payment_id || '' },
            credits: pendingTransaction.credits_purchased,
            bonusCredits: pendingTransaction.bonus_credits || 0,
            totalAmount: pendingTransaction.total_amount,
            createdAt: pendingTransaction.created_at,
            transactionId: pendingTransaction.id
          });
        } else {
          setPendingData(null);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento pendente:', error);
      setPendingData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isPixExpired]);

  const savePendingPayment = useCallback((data: PendingPixData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setPendingData(data);
  }, []);

  const cancelPendingPayment = useCallback(async () => {
    if (!pendingData?.transactionId) return false;

    try {
      const { error } = await supabase
        .from('credit_transactions')
        .update({ status: 'cancelled' })
        .eq('id', pendingData.transactionId);

      if (error) throw error;

      localStorage.removeItem(STORAGE_KEY);
      setPendingData(null);
      return true;
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
      return false;
    }
  }, [pendingData?.transactionId]);

  const clearPendingPayment = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPendingData(null);
  }, []);

  useEffect(() => {
    checkPendingPayment();
  }, [checkPendingPayment]);

  // Refresh periódico para verificar status
  useEffect(() => {
    if (!pendingData) return;

    const interval = setInterval(() => {
      checkPendingPayment();
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, [pendingData, checkPendingPayment]);

  return {
    pendingData,
    hasPendingPayment: !!pendingData,
    isExpired: pendingData ? isPixExpired(pendingData.createdAt) : false,
    timeRemaining: pendingData ? getTimeRemaining(pendingData.createdAt) : 0,
    isLoading,
    savePendingPayment,
    cancelPendingPayment,
    clearPendingPayment,
    refreshPendingPayment: checkPendingPayment
  };
};
