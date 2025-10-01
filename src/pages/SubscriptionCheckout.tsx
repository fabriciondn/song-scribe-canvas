import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Crown, CreditCard, ArrowLeft, Clock, Copy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import { usePaymentConfirmation } from '@/hooks/usePaymentConfirmation';

interface PixData {
  qr_code: string;
  qr_code_url: string;
  payment_id: string;
}

export default function SubscriptionCheckout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, isTrialActive, trialDaysRemaining, refreshSubscription } = useSubscription();
  const { profile } = useProfile();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [showQR, setShowQR] = useState(false);

  const handlePaymentConfirmed = () => {
    toast.success("Assinatura Pro ativada com sucesso! 🎉");
    setShowQR(false);
    refreshSubscription();
    setTimeout(() => navigate("/dashboard"), 2000);
  };

  const { isChecking } = usePaymentConfirmation({
    paymentId: pixData?.payment_id || "",
    isActive: showQR && !!pixData,
    onPaymentConfirmed: handlePaymentConfirmed
  });

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para assinar');
      return;
    }

    if (subscription?.status === 'active') {
      toast.info('Você já é um usuário Pro!');
      return;
    }

    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('create-pro-subscription-mercadopago', {
        body: {
          user_id: user.id,
          user_email: user.email,
          user_name: profile?.name || 'Usuário'
        }
      });

      if (error) throw error;

      if (data?.qr_code) {
        setPixData({
          qr_code: data.qr_code,
          qr_code_url: `data:image/png;base64,${data.qr_code_base64}`,
          payment_id: data.payment_id
        });
        setShowQR(true);
        toast.success('QR Code gerado! Escaneie para pagar via PIX.');
      } else {
        toast.error('Erro ao gerar QR Code');
      }
    } catch (error: any) {
      console.error('Erro ao processar assinatura:', error);
      toast.error('Erro ao processar assinatura. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const freeFeatures = [
    'Dashboard pessoal',
    'Registro autoral básico',
    'Lixeira',
    'Configurações de conta'
  ];

  const proFeatures = [
    'Tudo do plano Gratuito',
    'Compositor avançado',
    'Cifrador musical',
    'Cifrador Neo',
    'Bases musicais completas',
    'Sistema de pastas',
    'Rascunhos ilimitados',
    'Parcerias colaborativas',
    'Tutoriais exclusivos',
    'Suporte prioritário'
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Checkout Pro</h1>
              <p className="text-muted-foreground">
                Upgrade para desbloquear todos os recursos da plataforma
              </p>
            </div>
          </div>

          {/* Trial Info */}
          {isTrialActive && (
            <Card className="mb-6 border-amber-200 bg-amber-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">
                      Período de teste ativo
                    </p>
                    <p className="text-sm text-amber-700">
                      Restam {trialDaysRemaining} dias do seu período gratuito
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plans Comparison */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Plano Gratuito
                  {subscription?.plan_type === 'free' && (
                    <Badge variant="secondary">Atual</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Recursos básicos para começar
                </CardDescription>
                <div className="text-2xl font-bold">
                  R$ 0,00
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {freeFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-primary shadow-lg">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Crown className="h-3 w-3 mr-1" />
                  Recomendado
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Plano Pro
                  {subscription?.status === 'active' && (
                    <Badge variant="secondary">Atual</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Todos os recursos para profissionais
                </CardDescription>
                <div className="text-2xl font-bold">
                  R$ 14,99
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {proFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* User Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span>{profile?.name || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{user?.email}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total mensal:</span>
                  <span>R$ 14,99</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Section */}
          {showQR && pixData && (
            <Card className="mb-8 border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Escaneie o QR Code para pagar
                </CardTitle>
                <CardDescription>
                  Use o aplicativo do seu banco para escanear o código PIX
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  {pixData.qr_code_url ? (
                    <img src={pixData.qr_code_url} alt="QR Code PIX" className="w-64 h-64" />
                  ) : (
                    <QRCodeSVG value={pixData.qr_code} size={256} />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-center text-sm font-medium">Código PIX Copia e Cola:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pixData.qr_code}
                      readOnly
                      className="flex-1 p-2 text-xs bg-muted rounded border text-center"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(pixData.qr_code);
                        toast.success("Código copiado!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Valor: R$ 14,99</p>
                  <p className="text-xs text-muted-foreground">
                    {isChecking 
                      ? "Aguardando confirmação do pagamento..." 
                      : "Após o pagamento, sua conta será ativada automaticamente"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Checkout Button */}
          <div className="text-center">
            {subscription?.status === 'active' ? (
              <div className="space-y-4">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  <Crown className="h-4 w-4 mr-2" />
                  Você já é Pro!
                </Badge>
                <p className="text-muted-foreground">
                  Você já tem acesso a todos os recursos Pro
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Voltar ao Dashboard
                </Button>
              </div>
            ) : showQR ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {isChecking ? "Verificando pagamento..." : "Aguardando pagamento..."}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQR(false);
                    setPixData(null);
                  }}
                >
                  Voltar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full max-w-md"
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isProcessing ? 'Processando...' : 'Gerar QR Code PIX'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Pagamento seguro via PIX. Cancelamento a qualquer momento.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
