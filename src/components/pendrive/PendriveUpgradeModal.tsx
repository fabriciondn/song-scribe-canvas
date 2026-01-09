import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Crown, UsbIcon, Zap, Music, Download, Shield, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PendriveUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PendriveUpgradeModal = ({ open, onOpenChange }: PendriveUpgradeModalProps) => {
  const navigate = useNavigate();

  const plans = [
    {
      id: 'pendrive',
      name: 'Pendrive',
      price: 10,
      description: 'Acesso às suas músicas registradas',
      icon: UsbIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      features: [
        'Download de todas as suas músicas',
        'Player para ouvir antes de baixar',
        'Certificados em PDF',
        'Organização por gênero',
        'Histórico completo de registros',
      ],
      notIncluded: [
        'Compositor avançado',
        'Bases musicais',
        'Cifrador',
        'Sistema de parcerias',
      ],
      buttonText: 'Assinar Pendrive',
      route: '/dashboard/pendrive-checkout',
    },
    {
      id: 'pro',
      name: 'Completo',
      price: 14.99,
      originalPrice: 49.99,
      description: 'Todas as funcionalidades da plataforma',
      icon: Crown,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      isPopular: true,
      features: [
        'Tudo do plano Pendrive +',
        'Compositor avançado ilimitado',
        'Biblioteca de bases musicais',
        'Cifrador profissional',
        'Rascunhos ilimitados',
        'Sistema de parcerias',
        'Registro de obras autorais',
        'Tutoriais exclusivos',
        'Suporte prioritário',
      ],
      buttonText: 'Assinar Completo',
      route: '/dashboard/subscription-checkout',
    },
  ];

  const handleSelectPlan = (route: string) => {
    onOpenChange(false);
    navigate(route);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Download className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl">Assine para fazer downloads</DialogTitle>
          <DialogDescription className="text-base">
            Para baixar suas músicas registradas, escolha um dos planos abaixo
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 py-4">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            
            return (
              <Card 
                key={plan.id}
                className={cn(
                  "relative transition-all duration-200 hover:shadow-lg cursor-pointer",
                  plan.isPopular && "border-2 border-primary shadow-md"
                )}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <Zap className="w-3 h-3" />
                      Mais Vantajoso
                    </Badge>
                  </div>
                )}

                <CardContent className="pt-6 space-y-4">
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <div className={cn(
                      "mx-auto w-12 h-12 rounded-xl flex items-center justify-center",
                      plan.bgColor
                    )}>
                      <IconComponent className={cn("h-6 w-6", plan.color)} />
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center space-y-1">
                    {plan.originalPrice && (
                      <p className="text-sm text-muted-foreground">
                        <span className="line-through">R$ {plan.originalPrice.toFixed(2)}</span>
                      </p>
                    )}
                    <div className="text-3xl font-bold">
                      R$ {plan.price.toFixed(2)}
                      <span className="text-sm font-normal text-muted-foreground">/mês</span>
                    </div>
                    {plan.originalPrice && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30">
                        Economia de R$ {(plan.originalPrice - plan.price).toFixed(2)}/mês
                      </Badge>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Not included */}
                  {plan.notIncluded && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground font-medium">Não inclui:</p>
                      {plan.notIncluded.map((item, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-red-400 text-xs">✕</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Button */}
                  <Button 
                    className="w-full" 
                    variant={plan.isPopular ? "default" : "outline"}
                    size="lg"
                    onClick={() => handleSelectPlan(plan.route)}
                  >
                    {plan.isPopular && <Crown className="mr-2 h-4 w-4" />}
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Benefits */}
        <div className="border-t border-border/50 pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <Shield className="h-5 w-5 mx-auto text-primary" />
              <p className="text-xs text-muted-foreground">Pagamento Seguro</p>
            </div>
            <div className="space-y-1">
              <Star className="h-5 w-5 mx-auto text-primary" />
              <p className="text-xs text-muted-foreground">Cancele a qualquer momento</p>
            </div>
            <div className="space-y-1">
              <Music className="h-5 w-5 mx-auto text-primary" />
              <p className="text-xs text-muted-foreground">Acesso imediato</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendriveUpgradeModal;
