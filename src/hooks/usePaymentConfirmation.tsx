
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UsePaymentConfirmationProps {
  paymentId: string | null;
  isActive: boolean;
  onPaymentConfirmed: (creditsAdded: number) => void;
}

export function usePaymentConfirmation({ 
  paymentId, 
  isActive, 
  onPaymentConfirmed 
}: UsePaymentConfirmationProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { toast } = useToast();
  const maxAttempts = 120; // 10 minutos máximo (5 segundos * 120)

  const checkPaymentStatus = useCallback(async () => {
    if (!paymentId || !isActive || isChecking) return;

    setIsChecking(true);
    setAttempts(prev => prev + 1);

    try {
      console.log(`🔍 Checking payment status (attempt ${attempts + 1}/${maxAttempts})...`);
      
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId, type: 'credits' }
      });

      if (error) {
        console.error('❌ Error checking payment:', error);
        return;
      }

      console.log('📊 Payment status response:', data);

      if (data?.isPaid || data?.paid) {
        console.log('✅ Payment confirmed!');
        
        // Buscar informações da transação para saber quantos créditos foram adicionados
        const { data: transactionData, error: transactionError } = await supabase
          .from('credit_transactions')
          .select('credits_purchased, bonus_credits')
          .eq('payment_id', paymentId.toString())
          .eq('status', 'completed')
          .single();

        const creditsAdded = transactionData 
          ? (transactionData.credits_purchased || 0) + (transactionData.bonus_credits || 0)
          : 1; // fallback

        console.log('💰 Credits added:', creditsAdded);

        // Disparar eventos para atualização
        window.dispatchEvent(new CustomEvent('credits-updated'));
        window.dispatchEvent(new CustomEvent('credits-increased', { 
          detail: { creditsAdded }
        }));

        onPaymentConfirmed(creditsAdded);
        
        toast({
          title: "Pagamento Confirmado! 🎉",
          description: `${creditsAdded} créditos foram adicionados à sua conta.`,
          duration: 5000
        });

        return;
      }

      // Se atingiu o máximo de tentativas sem sucesso
      if (attempts >= maxAttempts) {
        console.log('⏰ Timeout: maximum attempts reached');
        toast({
          title: "Verificação de Pagamento",
          description: "O pagamento pode demorar alguns minutos para ser processado. Verifique sua conta em instantes.",
          variant: "default"
        });
      }

    } catch (error) {
      console.error('❌ Unexpected error checking payment:', error);
    } finally {
      setIsChecking(false);
    }
  }, [paymentId, isActive, isChecking, attempts, maxAttempts, onPaymentConfirmed, toast]);

  // Polling effect
  useEffect(() => {
    if (!isActive || !paymentId || attempts >= maxAttempts) return;

    // Primeira verificação imediata
    if (attempts === 0) {
      checkPaymentStatus();
    }

    const interval = setInterval(() => {
      if (!isChecking) {
        checkPaymentStatus();
      }
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
  }, [isActive, paymentId, attempts, maxAttempts, checkPaymentStatus, isChecking]);

  // Reset attempts when payment ID changes
  useEffect(() => {
    setAttempts(0);
  }, [paymentId]);

  // Listener para detecção de aumento de créditos
  useEffect(() => {
    const handleCreditsIncrease = (event: any) => {
      console.log('💰 Credits increase detected, stopping payment check');
      if (isActive && paymentId) {
        const creditsAdded = event.detail?.creditsAdded || event.detail?.difference || 1;
        onPaymentConfirmed(creditsAdded);
      }
    };

    window.addEventListener('credits-increased', handleCreditsIncrease);

    return () => {
      window.removeEventListener('credits-increased', handleCreditsIncrease);
    };
  }, [isActive, paymentId, onPaymentConfirmed]);

  return {
    isChecking,
    attempts,
    maxAttempts,
    checkPaymentStatus
  };
}
