
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
  const maxAttempts = 60; // 5 minutos máximo (5 segundos * 60)

  const checkPaymentStatus = useCallback(async () => {
    if (!paymentId || !isActive || isChecking) return;

    setIsChecking(true);
    setAttempts(prev => prev + 1);

    try {
      console.log(`🔍 Verificando status do pagamento (tentativa ${attempts + 1}/${maxAttempts})...`);
      
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId, type: 'credits' }
      });

      if (error) {
        console.error('❌ Erro ao verificar pagamento:', error);
        return;
      }

      console.log('📊 Status do pagamento:', data);

      if (data?.isPaid || data?.paid) {
        console.log('✅ Pagamento confirmado!');
        
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

        onPaymentConfirmed(creditsAdded);

        // Forçar atualização dos créditos
        window.dispatchEvent(new CustomEvent('credits-updated'));
        
        toast({
          title: "Pagamento Confirmado!",
          description: `${creditsAdded} créditos foram adicionados à sua conta.`
        });

        return;
      }

      // Se atingiu o máximo de tentativas sem sucesso
      if (attempts >= maxAttempts) {
        console.log('⏰ Timeout: máximo de tentativas atingido');
        toast({
          title: "Verificação de Pagamento",
          description: "Não foi possível confirmar automaticamente. Verifique sua conta em alguns minutos.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Erro inesperado ao verificar pagamento:', error);
    } finally {
      setIsChecking(false);
    }
  }, [paymentId, isActive, isChecking, attempts, maxAttempts, onPaymentConfirmed, toast]);

  // Polling effect
  useEffect(() => {
    if (!isActive || !paymentId || attempts >= maxAttempts) return;

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

  return {
    isChecking,
    attempts,
    maxAttempts,
    checkPaymentStatus
  };
}
