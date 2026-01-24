import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Gift, Check, AlertTriangle, User, Ticket, X, CheckCircle, Loader2 } from 'lucide-react';
import { useMobileDetection } from '@/hooks/use-mobile';
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
import { useProfileValidation } from '@/hooks/useProfileValidation';
import { useAbandonedCart } from '@/hooks/useAbandonedCart';
import { toast as sonnerToast } from 'sonner';

interface PixData {
  qr_code: string;
  qr_code_url: string;
  payment_id: string;
}

interface AppliedCoupon {
  code: string;
  discount_percentage: number;
  id: string;
}
export default function CreditsCheckout() {
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();
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
  const { isComplete: isProfileComplete, missingFields, completionPercentage } = useProfileValidation();
  const { 
    pendingData: abandonedCartData, 
    hasPendingPayment, 
    isExpired: isAbandonedCartExpired,
    savePendingPayment,
    clearPendingPayment 
  } = useAbandonedCart();
  
  const [credits, setCredits] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [creditsAdded, setCreditsAdded] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [restoredFromCart, setRestoredFromCart] = useState(false);

  // Restaurar pagamento pendente do carrinho abandonado
  useEffect(() => {
    if (hasPendingPayment && abandonedCartData && !restoredFromCart) {
      // Restaurar dados do carrinho abandonado
      setCredits(abandonedCartData.credits);
      
      // Se PIX ainda válido, restaurar QR code diretamente
      if (!isAbandonedCartExpired && abandonedCartData.pixData.qr_code) {
        setPixData(abandonedCartData.pixData);
        setShowQRCode(true);
        sonnerToast.info('Seu pagamento pendente foi restaurado');
      } else if (isAbandonedCartExpired) {
        // PIX expirado - notificar usuário que será gerado novo
        sonnerToast.warning('Seu PIX expirou. Clique em "Pagar com PIX" para gerar um novo código.');
      }
      
      setRestoredFromCart(true);
    }
  }, [hasPendingPayment, abandonedCartData, isAbandonedCartExpired, restoredFromCart]);
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
      
      // Limpar carrinho abandonado após pagamento confirmado
      clearPendingPayment();

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

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      sonnerToast.error('Digite um código de cupom');
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        sonnerToast.error('Cupom inválido ou não encontrado');
        return;
      }

      // Check if coupon is expired
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        sonnerToast.error('Este cupom expirou');
        return;
      }

      // Check if coupon has reached max uses
      if (data.max_uses && data.current_uses >= data.max_uses) {
        sonnerToast.error('Este cupom atingiu o limite de usos');
        return;
      }

      setAppliedCoupon({
        code: data.code,
        discount_percentage: data.discount_percentage,
        id: data.id,
      });
      sonnerToast.success(`Cupom aplicado! ${data.discount_percentage}% de desconto`);
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      sonnerToast.error('Erro ao validar cupom');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    sonnerToast.success('Cupom removido');
  };

  const pricing = useMemo(() => {
    let unitPrice = 19.99;
    let bonusCredits = 0;
    let savings = 0;
    let originalPrice = 19.99 * credits;

    // Super Oferta de 10 créditos + 2 grátis
    if (credits === 10) {
      unitPrice = 17.99;
      bonusCredits = 2;
      // Preço original seria 12 créditos x 19,99 = 239,88
      // Preço com oferta: 10 créditos x 17,99 = 179,90
      originalPrice = 19.99 * 12; // 239,88
      savings = originalPrice - 10 * unitPrice; // 239,88 - 179,90 = 59,98
    }
    let totalAmount = credits * unitPrice;
    
    // Aplicar desconto do cupom
    let couponDiscount = 0;
    if (appliedCoupon) {
      couponDiscount = totalAmount * (appliedCoupon.discount_percentage / 100);
      totalAmount = totalAmount - couponDiscount;
    }
    
    return {
      unitPrice,
      totalAmount,
      originalPrice,
      bonusCredits,
      savings,
      finalCredits: credits + bonusCredits,
      couponDiscount
    };
  }, [credits, appliedCoupon]);
  const handleProcessPayment = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para comprar créditos.",
        variant: "destructive"
      });
      return;
    }

    // Verificação adicional do perfil
    if (!profile) {
      toast({
        title: "Erro",
        description: "Perfil não carregado. Recarregue a página e tente novamente.",
        variant: "destructive"
      });
      return;
    }

    if (!isProfileComplete) {
      toast({
        title: "Perfil Incompleto",
        description: `Complete seu perfil antes de realizar o pagamento. Campos faltando: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
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
        const newPixData = {
          qr_code: data.qr_code,
          qr_code_url: data.qr_code_url || '',
          payment_id: data.payment_id
        };
        
        setPixData(newPixData);
        setShowQRCode(true);
        
        // Salvar dados do PIX para recuperação (carrinho abandonado)
        if (data.transaction_id) {
          savePendingPayment({
            pixData: newPixData,
            credits: credits,
            bonusCredits: pricing.bonusCredits,
            totalAmount: pricing.totalAmount,
            createdAt: new Date().toISOString(),
            transactionId: data.transaction_id
          });
        }
        
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
  if (isMobile) {
    return (
      <>
        <div className="min-h-screen bg-background pb-24">
          <div className="w-full max-w-md mx-auto p-4">
            {/* Header */}
            <header className="flex flex-col items-center mb-6 relative">
              <h1 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Checkout</h1>
              <div className="w-full flex items-center justify-start">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Voltar ao Dashboard
                </button>
              </div>
            </header>

            {!isProfileComplete && (
              <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950 mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-amber-800 dark:text-amber-300 flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4" />
                    Perfil Incompleto ({completionPercentage}%)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Complete seu perfil antes de comprar créditos:
                  </p>
                  <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-400 space-y-1">
                    {missingFields.map((field, index) => (
                      <li key={index}>{field}</li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => navigate('/dashboard/settings')} 
                    className="w-full"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Completar Perfil
                  </Button>
                </CardContent>
              </Card>
            )}

            {isProfileComplete && (
              <main className="space-y-4">
                {/* Comprar Créditos Card */}
                <section className="bg-card rounded-xl p-5 shadow-sm border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Coins className="h-5 w-5 text-muted-foreground" />
                    <h2 className="font-semibold text-lg text-foreground">Comprar Créditos</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
                        Quantidade de Créditos
                      </label>
                      <Select value={credits.toString()} onValueChange={value => setCredits(parseInt(value))}>
                        <SelectTrigger className="w-full bg-muted border-border rounded-lg px-4 py-3 text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'crédito' : 'créditos'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Resumo de valores */}
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border/50">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Créditos base:</span>
                        <span className="font-medium text-foreground">{credits}</span>
                      </div>
                      {pricing.bonusCredits > 0 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Créditos bônus:</span>
                          <span className="font-medium text-green-500">+{pricing.bonusCredits}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Total de créditos:</span>
                        <span className="font-bold text-primary">{pricing.finalCredits}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-border flex justify-between items-end">
                        <span className="font-medium text-foreground">Valor total:</span>
                        <div className="text-right">
                          {pricing.savings > 0 && (
                            <div className="text-xs text-muted-foreground line-through">
                              R$ {pricing.originalPrice.toFixed(2)}
                            </div>
                          )}
                          <span className="font-bold text-xl text-foreground">
                            R$ {pricing.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Oferta Especial */}
                <div>
                  <section 
                    onClick={() => setCredits(10)}
                    className={`relative rounded-xl p-0 shadow-lg border-2 overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-[1.01] ${
                      credits === 10 
                        ? 'border-green-500 bg-green-500/5' 
                        : 'border-green-500/50 bg-card'
                    }`}
                  >
                    {/* Badge */}
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-3 py-1.5 rounded-bl-xl z-20 shadow-md tracking-wider">
                      OFERTA LIMITADA
                    </div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
                    
                    <div className="p-5 flex items-center gap-4 relative z-10">
                      <div className="flex-shrink-0 relative">
                        <div className="absolute inset-0 bg-green-500 blur-xl opacity-40 animate-pulse rounded-full" />
                        <div className="w-12 h-12 rounded-full bg-background border border-green-500 flex items-center justify-center relative z-10 shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                          <Gift className="h-6 w-6 text-green-500" />
                        </div>
                      </div>
                      
                      <div className="flex-grow min-w-0 pr-2">
                        <h3 className="text-green-500 font-bold text-[11px] uppercase tracking-widest mb-1">
                          Aproveite o Desconto
                        </h3>
                        <p className="text-foreground text-sm leading-snug font-medium">
                          Leve <span className="text-green-500 font-black text-base">+2 Registros GRÁTIS</span> agora!
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-xs text-muted-foreground line-through decoration-red-500/70 decoration-2">R$ 239,88</span>
                          <span className="text-lg font-bold text-foreground">R$ 179,90</span>
                        </div>
                      </div>
                    </div>
                  </section>
                  
                  <div className="mt-2 text-center">
                    <p className="text-[13px] text-muted-foreground font-medium">
                      12 créditos por R$ 17,99 cada (apenas os 10)
                    </p>
                  </div>
                </div>

                {/* Cupom de Desconto */}
                <section className="bg-card rounded-xl p-5 shadow-sm border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Ticket className="h-5 w-5 text-muted-foreground rotate-90" />
                    <h2 className="font-semibold text-base text-foreground">Cupom de Desconto</h2>
                  </div>
                  
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg border border-green-500/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <span className="font-mono font-bold text-sm">{appliedCoupon.code}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({appliedCoupon.discount_percentage}% off)
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="DIGITE O CUPOM"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-grow bg-muted border-border rounded-lg px-4 py-2.5 text-sm uppercase placeholder:text-muted-foreground"
                        onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                      />
                      <Button
                        variant="secondary"
                        onClick={handleValidateCoupon}
                        disabled={isValidatingCoupon}
                        className="px-5"
                      >
                        {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                      </Button>
                    </div>
                  )}
                </section>

                {/* Resumo do Pedido */}
                <section className="bg-card rounded-xl p-5 shadow-sm border border-border">
                  <h2 className="font-bold text-lg text-foreground mb-4">Resumo do Pedido</h2>
                  
                  {/* Dados do usuário */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between items-start text-xs sm:text-sm">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="text-foreground font-medium text-right max-w-[60%] truncate">
                        {profile?.name || 'Não informado'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start text-xs sm:text-sm">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="text-foreground font-medium text-right max-w-[60%] truncate">
                        {user.email}
                      </span>
                    </div>
                    <div className="flex justify-between items-start text-xs sm:text-sm">
                      <span className="text-muted-foreground">CPF:</span>
                      <span className="text-foreground font-medium text-right">
                        {profile?.cpf || 'Não informado'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start text-xs sm:text-sm">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span className="text-foreground font-medium text-right">
                        {profile?.cellphone || 'Não informado'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start text-xs sm:text-sm">
                      <span className="text-muted-foreground">Créditos atuais:</span>
                      <span className="text-foreground font-bold text-right">
                        {profile?.credits || 0}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes da compra */}
                  <div className="pt-4 border-t border-border space-y-2">
                    <h3 className="text-sm font-medium text-foreground mb-2">Detalhes da Compra</h3>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Quantidade:</span>
                      <span className="font-medium text-foreground">{credits} créditos</span>
                    </div>
                    {pricing.bonusCredits > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Créditos bônus:</span>
                        <span className="font-medium text-green-500">+{pricing.bonusCredits}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Total de créditos:</span>
                      <span className="font-bold text-primary">{pricing.finalCredits}</span>
                    </div>
                    {appliedCoupon && pricing.couponDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-500">
                        <span>Desconto ({appliedCoupon.discount_percentage}%):</span>
                        <span>- R$ {pricing.couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-2">
                      <span className="text-lg font-bold text-foreground">Valor total:</span>
                      <span className="text-xl font-bold text-primary">R$ {pricing.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Botão de finalizar */}
                  <Button 
                    onClick={handleProcessPayment} 
                    disabled={isProcessing} 
                    className="w-full mt-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    size="lg"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Finalizar Compra - R$ {pricing.totalAmount.toFixed(2)}</span>
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </div>
                    )}
                  </Button>
                </section>
              </main>
            )}
          </div>
        </div>
        <PaymentSuccessModal isOpen={showSuccessModal} creditsAdded={creditsAdded} onContinue={handleSuccessModalContinue} />
      </>
    );
  }

  // Desktop Layout
  return (
    <>
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

          {!isProfileComplete && (
            <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950 mb-6 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Perfil Incompleto ({completionPercentage}%)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
                <p className="text-amber-700 dark:text-amber-300">
                  Para adicionar saldo, você precisa completar seu perfil. Os seguintes campos são obrigatórios:
                </p>
                <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-400 space-y-1">
                  {missingFields.map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
                <Button 
                  onClick={() => navigate('/dashboard/settings')} 
                  className="w-full"
                  size="lg"
                >
                  <User className="h-4 w-4 mr-2" />
                  Completar Perfil
                </Button>
              </CardContent>
            </Card>
          )}

          {isProfileComplete && (
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
                      <Input 
                        id="credits" 
                        type="number" 
                        min="1" 
                        max="100" 
                        value={credits} 
                        onChange={e => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 1) {
                            setCredits(Math.min(100, value));
                          } else if (e.target.value === '') {
                            setCredits(1);
                          }
                        }} 
                        className="text-lg font-semibold" 
                      />
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

                    {/* Desktop Coupon Section */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Ticket className="h-4 w-4" />
                        Cupom de Desconto
                      </h4>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg border border-green-500/30">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div>
                              <span className="font-mono font-bold text-sm">{appliedCoupon.code}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({appliedCoupon.discount_percentage}% off)
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Digite o cupom"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="uppercase text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleValidateCoupon}
                            disabled={isValidatingCoupon}
                          >
                            {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                          </Button>
                        </div>
                      )}
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
                      {appliedCoupon && pricing.couponDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Desconto ({appliedCoupon.discount_percentage}%):</span>
                          <span>- R$ {pricing.couponDiscount.toFixed(2)}</span>
                        </div>
                      )}
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
          )}
        </div>
      </div>
      <PaymentSuccessModal isOpen={showSuccessModal} creditsAdded={creditsAdded} onContinue={handleSuccessModalContinue} />
    </>
  );
}