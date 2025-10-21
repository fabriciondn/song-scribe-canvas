import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Gift, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { PaymentSuccessModal } from '@/components/checkout/PaymentSuccessModal';
import { usePaymentConfirmation } from '@/hooks/usePaymentConfirmation';
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
    profile,
    loadProfile
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
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [creditsAdded, setCreditsAdded] = useState(0);
  const {
    isChecking
  } = usePaymentConfirmation({
    paymentId: pixData?.payment_id || null,
    isActive: showQRCode && !paymentConfirmed,
    onPaymentConfirmed: async credits => {
      setCreditsAdded(credits);
      setPaymentConfirmed(true);
      setShowQRCode(false);
      setShowSuccessModal(true);

      // Processar comissão de afiliado na primeira compra
      if (user?.id) {
        try {
          console.log('💰 Processando comissão de afiliado na primeira compra...');
          const {
            data,
            error
          } = await supabase.rpc('process_affiliate_first_purchase', {
            p_user_id: user.id,
            p_payment_amount: pricing.totalAmount,
            p_payment_id: pixData?.payment_id || ''
          });
          if (error) {
            console.error('⚠️ Erro ao processar comissão:', error);
          } else if (data) {
            console.log('✅ Comissão de afiliado processada com sucesso');
          }
        } catch (affiliateError) {
          console.error('⚠️ Erro ao processar comissão de afiliado:', affiliateError);
        }
      }

      // Recarregar perfil após confirmação
      if (typeof loadProfile === 'function') {
        setTimeout(() => {
          loadProfile();
        }, 1000);
      }
    }
  });

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
    let unitPrice = 19.99;
    let bonusCredits = 0;
    let savings = 0;
    let originalPrice = 19.99 * creditAmount;

    // Super Oferta de 10 créditos + 2 grátis
    if (creditAmount === 10) {
      unitPrice = 17.99;
      bonusCredits = 2;
      // Preço original seria 12 créditos x 19,99 = 239,88
      // Preço com oferta: 10 créditos x 17,99 = 179,90
      originalPrice = 19.99 * 12; // 239,88
      savings = originalPrice - 10 * unitPrice; // 239,88 - 179,90 = 59,98
    }
    let totalAmount = creditAmount * unitPrice;
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
    console.log('🔄 Iniciando processamento de pagamento com Mercado Pago...', {
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
      } = await supabase.functions.invoke('create-mercadopago-payment', {
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
      console.log('📡 Resposta da Edge Function (Mercado Pago):', {
        data,
        error
      });
      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        let errorMsg = 'Não foi possível processar o pagamento.';
        if (error.message) {
          errorMsg = error.message;
        }
        if (error.context?.response?.body) {
          try {
            const responseBody = typeof error.context.response.body === 'string' ? JSON.parse(error.context.response.body) : error.context.response.body;
            if (responseBody?.error) {
              errorMsg = responseBody.error;
            }
          } catch (parseError) {
            console.error('Erro ao parsear resposta:', parseError);
          }
        }
        toast({
          title: "Erro no Pagamento",
          description: errorMsg,
          variant: "destructive"
        });
        return;
      }
      if (data?.success && data?.qr_code && data?.payment_id) {
        setPixData({
          qr_code: data.qr_code,
          qr_code_url: data.qr_code_url || '',
          payment_id: data.payment_id
        });
        setShowQRCode(true);
        toast({
          title: "PIX Gerado!",
          description: "Use o QR Code para realizar o pagamento via Mercado Pago."
        });
      } else {
        console.error('❌ Resposta inválida:', data);
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
  const handleSuccessModalContinue = () => {
    setShowSuccessModal(false);
    navigate('/dashboard');
  };
  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto">
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
  if (showQRCode && pixData) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-4">
        <div className="max-w-2xl mx-auto">
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
              <CardTitle className="text-2xl text-foreground">Pagamento PIX - Mercado Pago</CardTitle>
              <p className="text-muted-foreground">
                Escaneie o QR Code ou copie o código PIX para realizar o pagamento
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                {pixData.qr_code_url && <div className="bg-white p-4 rounded-lg">
                    <img src={pixData.qr_code_url} alt="QR Code PIX" className="w-64 h-64" />
                  </div>}
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

                {/* Status de verificação */}
                {isChecking && <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">
                      Aguardando confirmação do pagamento...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Verificação automática em andamento
                    </p>
                  </div>}

                {!isChecking && <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-orange-600">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Aguardando pagamento...</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Após realizar o pagamento, os créditos serão liberados automaticamente
                    </p>
                  </div>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Modal */}
        <PaymentSuccessModal isOpen={showSuccessModal} creditsAdded={creditsAdded} onContinue={handleSuccessModalContinue} />
      </div>;
  }
  return <>
      {/* Hook para detectar mobile */}
      <div className="block md:hidden">
        {/* Layout Mobile */}
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <img src={theme === 'dark' ? "/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" : "/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"} alt="Compuse Logo" className="h-8 mx-auto" />
              <p className="text-muted-foreground text-xs mt-1">Checkout</p>
            </div>

            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4 text-sm">
              <ArrowLeft className="mr-1 h-3 w-3" />
              Voltar ao Dashboard
            </Button>

            <div className="space-y-4">
              {/* Mobile Credit Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                    <Coins className="h-4 w-4" />
                    Comprar Créditos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm">Quantidade de Créditos</Label>
                    <Select value={credits.toString()} onValueChange={value => setCredits(parseInt(value))}>
                      <SelectTrigger className="text-base font-semibold mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({
                        length: 20
                      }, (_, i) => i + 1).map(num => <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'crédito' : 'créditos'}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground">Créditos base:</span>
                      <span className="font-medium">{credits}</span>
                    </div>
                    {pricing.bonusCredits > 0 && <div className="flex justify-between items-center mb-1">
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
                        <div className="text-base font-bold text-foreground">
                          R$ {pricing.totalAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Order Bump */}
              <Card className={`border-2 cursor-pointer transition-all ${credits === 10 ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-green-200 hover:border-green-300'}`} onClick={() => setCredits(10)}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 p-1.5 rounded-full">
                        <Gift className="h-3 w-3 text-green-600" />
                      </div>
                       <div>
                         <h3 className="font-semibold text-green-800 dark:text-green-200 text-sm">Super Oferta</h3>
                         <p className="text-xs text-green-700 dark:text-green-300 font-semibold">10 Créditos + 2 GRÁTIS</p>
                         <p className="text-xs text-green-600 dark:text-green-400">12 créditos por R$ 17,99 cada (apenas os 10)</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-xs text-green-600 dark:text-green-400 line-through">R$ 239,88</div>
                       <div className="text-sm font-bold text-green-800 dark:text-green-200">R$ 179,90</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-lg">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm">
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

                  <div className="space-y-1 text-sm">
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
                    <div className="flex justify-between text-base">
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
        </div>
      </div>

      {/* Layout Desktop */}
      <div className="hidden md:block">
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <img src={theme === 'dark' ? "/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" : "/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"} alt="Compuse Logo" className="h-10 mx-auto" />
              <p className="text-muted-foreground text-sm mt-1">Checkout</p>
            </div>

            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[calc(100vh-200px)]">
              {/* Left Column - Credit Selection */}
              <div className="lg:col-span-2 space-y-6">
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

                {/* Desktop Order Bump */}
                <div className="max-w-2xl mx-auto">
                  <Card className={`border-2 cursor-pointer transition-all ${credits === 10 ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-green-200 hover:border-green-300'}`} onClick={() => setCredits(10)}>
                    <CardContent className="p-6">
                      <div className="text-center space-y-3">
                        <div className="bg-green-100 p-3 rounded-full w-fit mx-auto">
                          <Gift className="h-6 w-6 text-green-600" />
                        </div>
                         <div>
                           <h3 className="font-semibold text-green-800 dark:text-green-200 text-xl">Super Oferta de lançamento</h3>
                           <p className="text-green-700 dark:text-green-300 font-medium text-lg">10 Créditos + 2 GRÁTIS</p>
                           <p className="text-sm text-green-600 dark:text-green-400">12 créditos por R$ 17,99 cada (apenas os 10)</p>
                         </div>
                         <div className="text-center">
                           <div className="text-sm text-green-600 dark:text-green-400 line-through">R$ 239,88</div>
                           <div className="text-2xl font-bold text-green-800 dark:text-green-200">R$ 179,90</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-6">
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
          </div>
        </div>
      </div>
      {/* Success Modal */}
      <PaymentSuccessModal isOpen={showSuccessModal} creditsAdded={creditsAdded} onContinue={handleSuccessModalContinue} />
    </>;
}