import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Check, Shield, Star, Music } from 'lucide-react';

interface ProUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

export const ProUpgradeModal = ({ 
  open, 
  onOpenChange, 
  featureName = 'Este recurso' 
}: ProUpgradeModalProps) => {
  const navigate = useNavigate();

  const features = [
    '2 créditos garantidos por mês',
    '+1 crédito de bônus mensal',
    'Compositor avançado',
    'Bases musicais completas',
    'Sistema de pastas',
    'Rascunhos ilimitados',
    'Parcerias colaborativas',
    'Pendrive inteligente',
    'Tutoriais exclusivos',
    'Suporte prioritário'
  ];

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/subscription-checkout');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <DialogTitle className="text-xl">Recurso Exclusivo Pro</DialogTitle>
          <DialogDescription className="text-base">
            <span className="font-medium text-foreground">{featureName}</span> está disponível apenas para assinantes Pro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Price */}
          <div className="text-center space-y-1 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="text-3xl font-bold text-primary">
              R$ 30,00
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <p className="text-sm font-medium text-muted-foreground">O que você ganha:</p>
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleUpgrade}
          >
            <Crown className="mr-2 h-4 w-4" />
            Liberar Acesso Agora
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancele a qualquer momento. Sem compromisso.
          </p>
        </div>

        {/* Benefits footer */}
        <div className="border-t border-border/50 pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <Shield className="h-4 w-4 mx-auto text-primary" />
              <p className="text-[10px] text-muted-foreground">Pagamento Seguro</p>
            </div>
            <div className="space-y-1">
              <Star className="h-4 w-4 mx-auto text-primary" />
              <p className="text-[10px] text-muted-foreground">Cancele quando quiser</p>
            </div>
            <div className="space-y-1">
              <Music className="h-4 w-4 mx-auto text-primary" />
              <p className="text-[10px] text-muted-foreground">Acesso imediato</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
