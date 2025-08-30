
import React from 'react';
import { Check, Coins, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  creditsAdded: number;
  onContinue: () => void;
}

export function PaymentSuccessModal({ isOpen, creditsAdded, onContinue }: PaymentSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto animate-in zoom-in-95 duration-300">
        <CardContent className="pt-8 pb-6 text-center">
          {/* Animated Success Icon */}
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>

          {/* Success Message */}
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Obrigado!
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Seu pagamento foi confirmado com sucesso
          </p>

          {/* Credits Info */}
          <div className="bg-primary/10 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold text-primary">
                +{creditsAdded} créditos
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Foram adicionados à sua conta
            </p>
          </div>

          {/* Success Details */}
          <div className="space-y-2 mb-6 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Pagamento processado</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Créditos liberados</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Conta atualizada</span>
            </div>
          </div>

          {/* Action Button */}
          <Button onClick={onContinue} className="w-full" size="lg">
            Continuar para Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {/* Auto redirect countdown could be added here if desired */}
          <p className="text-xs text-muted-foreground mt-4">
            Você será redirecionado automaticamente em alguns segundos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
