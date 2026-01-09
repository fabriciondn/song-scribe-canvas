import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAbandonedCart } from '@/hooks/useAbandonedCart';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const AbandonedCartIndicator: React.FC = () => {
  const navigate = useNavigate();
  const {
    pendingData,
    hasPendingPayment,
    isExpired,
    timeRemaining,
    cancelPendingPayment,
    isLoading
  } = useAbandonedCart();

  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  // Atualizar contador de tempo
  useEffect(() => {
    if (!hasPendingPayment || isExpired) return;

    setDisplayTime(timeRemaining);

    const interval = setInterval(() => {
      setDisplayTime(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [hasPendingPayment, isExpired, timeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinalize = () => {
    setIsOpen(false);
    navigate('/dashboard/credits-checkout');
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const success = await cancelPendingPayment();
      if (success) {
        toast.success('Pedido cancelado com sucesso');
        setIsOpen(false);
      } else {
        toast.error('Erro ao cancelar pedido');
      }
    } catch (error) {
      toast.error('Erro ao cancelar pedido');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading || !hasPendingPayment) {
    return null;
  }

  return (
    <>
      {/* Ícone pulsante */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative h-9 w-9"
      >
        <div className="relative">
          <ShoppingCart className="h-4 w-4 text-orange-500" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
          </span>
        </div>
      </Button>

      {/* Dialog/Popup */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              Você tem um pedido em aberto!
            </DialogTitle>
            <DialogDescription>
              Você gerou um PIX mas ainda não finalizou o pagamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Detalhes do pedido */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Créditos:</span>
                <span className="font-medium text-foreground">
                  {pendingData?.credits} {pendingData?.bonusCredits ? `+ ${pendingData.bonusCredits} bônus` : ''}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor:</span>
                <span className="font-bold text-lg text-foreground">
                  R$ {pendingData?.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Status do PIX */}
            {isExpired ? (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    PIX Expirado
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Será gerado um novo código ao finalizar
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Clock className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    PIX ainda válido
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expira em {formatTime(displayTime)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isCancelling}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {isCancelling ? 'Cancelando...' : 'Cancelar Pedido'}
            </Button>
            <Button
              onClick={handleFinalize}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Finalizar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
