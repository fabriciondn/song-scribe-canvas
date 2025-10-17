import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function ModeratorRecharge() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loadProfile } = useProfile();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [credits, setCredits] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [creditsAdded, setCreditsAdded] = useState(0);

  const { isChecking } = usePaymentConfirmation({
    paymentId: pixData?.payment_id || null,
    isActive: showQRCode && !paymentConfirmed,
    onPaymentConfirmed: async (credits) => {
      setCreditsAdded(credits);
      setPaymentConfirmed(true);
      setShowQRCode(false);
      setShowSuccessModal(true);
      
      if (typeof loadProfile === 'function') {
        setTimeout(() => {
          loadProfile();
        }, 1000);
      }
    }
  });

  const UNIT_PRICE = 10.00; // R$ 10,00 por crédito para moderadores
  const totalAmount = credits * UNIT_PRICE;

  const handleProcessPayment = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para comprar créditos.",
        variant: "destructive"
      });
      return;
    }

    if (!profile?.name || !profile?.cpf || !profile?.cellphone) {
      toast({
        title: "Dados Incompletos",
        description: "Para continuar, complete seu perfil com nome, CPF e telefone nas configurações.",
        variant: "destructive"
      });
      navigate('/settings');
      return;
    }

    if (credits < 1) {
      toast({
        title: "Quantidade Inválida",
        description: "Você precisa comprar pelo menos 1 crédito.",
        variant: "destructive"
      });
      return;
    }

    console.log('🔄 Iniciando recarga de moderador...', {
      credits,
      unitPrice: UNIT_PRICE,
      totalAmount,
      userId: user.id
    });

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-mercadopago-payment', {
        body: {
          credits: credits,
          bonusCredits: 0,
          unitPrice: UNIT_PRICE,
          totalAmount: totalAmount,
          customerData: {
            name: profile.name,
            email: user.email,
            cpf: profile.cpf,
            phone: profile.cellphone
          }
        }
      });

      console.log('📡 Resposta da Edge Function:', { data, error });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        
        let errorMsg = 'Não foi possível processar o pagamento.';
        
        if (error.message) {
          errorMsg = error.message;
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
          description: "Use o QR Code para realizar o pagamento."
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
    navigate('/moderator');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
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
    );
  }

  if (showQRCode && pixData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-4">
        <div className="max-w-2xl mx-auto">
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
                {pixData.qr_code_url && (
                  <div className="bg-white p-4 rounded-lg">
                    <img src={pixData.qr_code_url} alt="QR Code PIX" className="w-64 h-64" />
                  </div>
                )}
                <div className="w-full">
                  <Label htmlFor="pix-code">Código PIX</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      id="pix-code" 
                      value={pixData.qr_code} 
                      readOnly 
                      className="font-mono text-xs" 
                    />
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
                    R$ {totalAmount.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {credits} {credits === 1 ? 'crédito' : 'créditos'}
                  </p>
                </div>

                {isChecking && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">
                      Aguardando confirmação do pagamento...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Verificação automática em andamento
                    </p>
                  </div>
                )}

                {!isChecking && (
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-orange-600">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Aguardando pagamento...</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Após realizar o pagamento, os créditos serão liberados automaticamente
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <PaymentSuccessModal 
          isOpen={showSuccessModal}
          creditsAdded={creditsAdded}
          onContinue={handleSuccessModalContinue}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <img 
            src={theme === 'dark' ? "/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" : "/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"} 
            alt="Compuse Logo" 
            className="h-10 mx-auto" 
          />
          <p className="text-muted-foreground text-sm mt-1">Recarga de Créditos - Moderador</p>
        </div>

        <Button variant="ghost" onClick={() => navigate('/moderator')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Painel
        </Button>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Wallet className="h-5 w-5 text-green-600" />
                Recarga de Créditos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="credits">Quantidade de Créditos</Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  value={credits}
                  onChange={(e) => setCredits(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-lg font-semibold mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mínimo: 1 crédito
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Preço por crédito:</span>
                  <span className="font-medium">R$ {UNIT_PRICE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Quantidade:</span>
                  <span className="font-medium">{credits}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Valor total:</span>
                  <span className="text-xl font-bold text-foreground">
                    R$ {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleProcessPayment} 
                disabled={isProcessing || credits < 1}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isProcessing ? (
                  <>Processando...</>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Gerar PIX
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Informações sobre Recarga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Como funciona?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Defina a quantidade de créditos que deseja comprar</li>
                  <li>• Cada crédito custa R$ 10,00</li>
                  <li>• Pagamento via PIX instantâneo</li>
                  <li>• Créditos liberados automaticamente após confirmação</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Para que servem os créditos?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Distribuir para usuários que você gerencia</li>
                  <li>• Cada crédito permite uma ação na plataforma</li>
                  <li>• Gerencie os créditos dos seus usuários</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-800 dark:text-green-200 text-sm mb-1">
                  Preço Especial para Moderadores
                </h3>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Moderadores têm preço diferenciado de R$ 10,00 por crédito
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
