import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Gift, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
interface PixData {
  qr_code: string;
  qr_code_url: string;
  payment_id: string;
}
export default function CreditsCheckout() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    profile
  } = useProfile();
  const {
    toast
  } = useToast();
  const {
    theme
  } = useTheme();
  const [credits, setCredits] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Force theme consistency
  useEffect(() => {
    if (theme && document.documentElement.classList.contains('dark') !== (theme === 'dark')) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);
  const calculatePricing = (creditAmount: number) => {
    let unitPrice = 30.00;
    let bonusCredits = 0;
    let savings = 0;
    if (creditAmount >= 10) {
      unitPrice = 25.00;
      bonusCredits = 2;
      savings = (30 - 25) * creditAmount + 2 * 30; // R$5 per credit + 2 free credits
    } else if (creditAmount >= 5) {
      unitPrice = 25.00;
      savings = (30 - 25) * creditAmount; // R$5 per credit
    }
    const totalAmount = unitPrice * creditAmount;
    const originalPrice = 30 * creditAmount;
    return {
      unitPrice,
      totalAmount,
      originalPrice,
      bonusCredits,
      savings,
      finalCredits: creditAmount + bonusCredits
    };
  };
  const pricing = calculatePricing(credits);
  const handleProcessPayment = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para comprar créditos.",
        variant: "destructive"
      });
      return;
    }

    // Validar dados obrigatórios do perfil
    if (!profile?.name || !profile?.cpf || !profile?.cellphone) {
      toast({
        title: "Dados Incompletos",
        description: "Para continuar, complete seu perfil com nome, CPF e telefone nas configurações.",
        variant: "destructive"
      });
      navigate('/settings');
      return;
    }
    console.log('🔄 Iniciando processamento de pagamento...', {
      credits: credits,
      bonusCredits: pricing.bonusCredits,
      unitPrice: pricing.unitPrice,
      totalAmount: pricing.totalAmount,
      userId: user.id
    });
    setIsProcessing(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('create-credits-payment', {
        body: {
          credits: credits,
          bonusCredits: pricing.bonusCredits,
          unitPrice: pricing.unitPrice,
          totalAmount: pricing.totalAmount,
          customerData: {
            name: profile.name,
            email: user.email,
            cpf: profile.cpf,
            phone: profile.cellphone
          }
        }
      });
      console.log('📡 Resposta da Edge Function:', {
        data,
        error
      });
      if (error) {
        console.error('❌ Erro ao processar pagamento:', error);
        toast({
          title: "Erro no Pagamento",
          description: error.message || "Não foi possível processar o pagamento.",
          variant: "destructive"
        });
        return;
      }
      if (data?.qr_code && data?.payment_id) {
        console.log('✅ QR Code gerado com sucesso!', {
          payment_id: data.payment_id,
          has_qr_code: !!data.qr_code,
          has_qr_code_url: !!data.qr_code_url
        });
        setPixData({
          qr_code: data.qr_code,
          qr_code_url: data.qr_code_url,
          payment_id: data.payment_id
        });
        setShowQRCode(true);
        toast({
          title: "PIX Gerado!",
          description: "Use o QR Code para realizar o pagamento."
        });
      } else {
        console.error('❌ Dados insuficientes na resposta:', data);
        toast({
          title: "Erro na Resposta",
          description: "Resposta inválida do servidor. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao processar pagamento.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  const checkPaymentStatus = async () => {
    if (!pixData?.payment_id) return;
    setIsCheckingPayment(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('check-payment-status', {
        body: {
          paymentId: pixData.payment_id,
          type: 'credits'
        }
      });
      if (error) {
        console.error('Erro ao verificar pagamento:', error);
        return;
      }
      if (data?.paid) {
        setPaymentConfirmed(true);
        setIsCheckingPayment(false);

        // Dispatch event to update credits globally
        window.dispatchEvent(new CustomEvent('credits-updated'));
        toast({
          title: "Pagamento Confirmado!",
          description: `${pricing.finalCredits} créditos foram adicionados à sua conta.`
        });
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsCheckingPayment(false);
    }
  };
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQRCode && !paymentConfirmed && pixData?.payment_id) {
      interval = setInterval(checkPaymentStatus, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showQRCode, paymentConfirmed, pixData?.payment_id]);
  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          {/* Logo Centralizado */}
          <div className="text-center mb-8">
            <img src={theme === 'dark' ? "/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" : "/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"} alt="Compuse Logo" className="h-10 mx-auto" />
            <p className="text-muted-foreground text-sm mt-1">Sistema de Registro Autoral</p>
          </div>
          
          <Card className="w-full">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">Login Necessário</h2>
              <p className="text-muted-foreground mb-6">
                Você precisa estar logado para comprar créditos.
              </p>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Ir para Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  if (paymentConfirmed) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          {/* Logo Centralizado */}
          <div className="text-center mb-8">
            <img src={theme === 'dark' ? "/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" : "/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"} alt="Compuse Logo" className="h-10 mx-auto" />
            <p className="text-muted-foreground text-sm mt-1">Sistema de Registro Autoral</p>
          </div>
          
          <Card className="w-full">
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Pagamento Confirmado!</h2>
            <p className="text-muted-foreground mb-6">
              {pricing.finalCredits} créditos foram adicionados à sua conta com sucesso.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Voltar ao Dashboard
            </Button>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  if (showQRCode && pixData) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Logo Centralizado */}
          <div className="text-center mb-8">
            <img src={theme === 'dark' ? "/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" : "/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"} alt="Compuse Logo" className="h-10 mx-auto" />
            <p className="text-muted-foreground text-sm mt-1">Sistema de Registro Autoral</p>
          </div>

          <Button variant="ghost" onClick={() => setShowQRCode(false)} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Pagamento PIX</CardTitle>
              <p className="text-muted-foreground">
                Escaneie o QR Code ou copie o código PIX para realizar o pagamento
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <img src={pixData.qr_code_url} alt="QR Code PIX" className="w-64 h-64" />
                </div>
                
                <div className="w-full">
                  <Label htmlFor="pix-code">Código PIX</Label>
                  <div className="flex gap-2 mt-1">
                    <Input id="pix-code" value={pixData.qr_code} readOnly className="font-mono text-xs" />
                    <Button variant="outline" onClick={() => {
                    navigator.clipboard.writeText(pixData.qr_code);
                    toast({
                      title: "Copiado!",
                      description: "Código PIX copiado para a área de transferência."
                    });
                  }}>
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold text-foreground">
                    R$ {pricing.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pricing.finalCredits} créditos ({credits} + {pricing.bonusCredits} bônus)
                  </p>
                </div>

                {isCheckingPayment && <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">
                      Verificando pagamento...
                    </p>
                  </div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Logo Centralizado */}
        <div className="text-center mb-8">
          <img src={theme === 'dark' ? "/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" : "/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"} alt="Compuse Logo" className="h-10 mx-auto" />
          <p className="text-muted-foreground text-sm mt-1">Checkout</p>
        </div>

        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <div className="space-y-6">
          {/* Credit Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Coins className="h-5 w-5" />
                Comprar Créditos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="credits">Quantidade de Créditos</Label>
                <Input id="credits" type="number" min="1" max="100" value={credits} onChange={e => setCredits(Math.max(1, parseInt(e.target.value) || 1))} className="text-lg font-semibold" />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Créditos base:</span>
                  <span className="font-medium">{credits}</span>
                </div>
                {pricing.bonusCredits > 0 && <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Créditos bônus:</span>
                    <span className="font-medium text-green-600">+{pricing.bonusCredits}</span>
                  </div>}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Total de créditos:</span>
                  <span className="font-bold text-primary">{pricing.finalCredits}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Valor total:</span>
                  <div className="text-right">
                    {pricing.savings > 0 && <div className="text-xs text-muted-foreground line-through">
                        R$ {pricing.originalPrice.toFixed(2)}
                      </div>}
                    <div className="text-lg font-bold text-foreground">
                      R$ {pricing.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Bump Banners */}
          <div className="space-y-4">
            {/* 5 Credits Order Bump */}
            <Card className={`border-2 cursor-pointer transition-all ${credits === 5 ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' : 'border-orange-200 hover:border-orange-300'}`} onClick={() => setCredits(5)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-full">
                      <Gift className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-orange-800 dark:text-orange-200">Oferta Especial - 5 Créditos</h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300">De R$ 30,00 por apenas R$ 25,00 cada</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-orange-600 dark:text-orange-400 line-through">R$ 150,00</div>
                    <div className="text-lg font-bold text-orange-800 dark:text-orange-200">R$ 125,00</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 10 Credits Order Bump */}
            <Card className={`border-2 cursor-pointer transition-all ${credits === 10 ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-green-200 hover:border-green-300'}`} onClick={() => setCredits(10)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Gift className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800 dark:text-green-200">Super Oferta - 10 Registros+ 2 GRÁTIS</h3>
                      <p className="text-sm text-green-700 dark:text-green-300">12 créditos por R$ 25,00 cada (apenas os 10)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-600 dark:text-green-400 line-through">R$ 360,00</div>
                    <div className="text-lg font-bold text-green-800 dark:text-green-200">R$ 250,00</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{profile?.name || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPF:</span>
                  <span className="font-medium">{profile?.cpf || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefone:</span>
                  <span className="font-medium">{profile?.cellphone || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créditos atuais:</span>
                  <span className="font-medium">{profile?.credits || 0}</span>
                </div>
              </div>

              <hr />

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Detalhes da Compra</h4>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantidade:</span>
                  <span className="font-medium">{credits} créditos</span>
                </div>
                {pricing.bonusCredits > 0 && <div className="flex justify-between">
                    <span className="text-muted-foreground">Créditos bônus:</span>
                    <span className="font-medium text-green-600">+{pricing.bonusCredits}</span>
                  </div>}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de créditos:</span>
                  <span className="font-bold text-primary">{pricing.finalCredits}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Valor total:</span>
                  <span className="font-bold text-primary">R$ {pricing.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Button onClick={handleProcessPayment} disabled={isProcessing} className="w-full" size="lg">
                {isProcessing ? <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </div> : `Finalizar Compra - R$ ${pricing.totalAmount.toFixed(2)}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
}