import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UsbIcon, Check, Shield, CreditCard, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PendriveCheckout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

  const planDetails = {
    name: 'Pendrive',
    price: 10,
    features: [
      'Download de todas as suas músicas registradas',
      'Player para ouvir antes de baixar',
      'Certificados em PDF',
      'Organização por gênero',
      'Histórico completo de registros',
    ],
  };

  const handleCheckout = async () => {
    if (!user?.id) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!profile?.name || !profile?.cpf || !profile?.email) {
      toast.error('Complete seu perfil antes de continuar');
      navigate('/dashboard/settings');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-pendrive-subscription', {
        body: {
          userId: user.id,
          email: profile.email,
          name: profile.name,
        },
      });

      if (error) throw error;

      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('URL de pagamento não gerada');
      }
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveContainer>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Assinar Pendrive</h1>
            <p className="text-muted-foreground">Acesso às suas músicas registradas</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Plan Card */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <UsbIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{planDetails.name}</CardTitle>
                    <CardDescription>Assinatura mensal</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">R$ {planDetails.price.toFixed(2)}</div>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              <div className="space-y-2">
                {planDetails.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plano Pendrive (mensal)</span>
                <span>R$ {planDetails.price.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>R$ {planDetails.price.toFixed(2)}/mês</span>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Ir para Pagamento
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Pagamento seguro via MercadoPago</span>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Ao assinar, você concorda com nossos termos de uso.</p>
            <p>Cancele a qualquer momento sem taxas adicionais.</p>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
};

export default PendriveCheckout;
