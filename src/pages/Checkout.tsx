import { STANDARD_PLAN, STANDARD_ALLOWANCE_DESCRIPTION, STANDARD_ALLOWANCE_TERMS } from '@/lib/standardPlan';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Crown, Check, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const { subscription, refreshSubscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const planDetails = {
    name: STANDARD_PLAN.name,
    originalPrice: STANDARD_PLAN.regularPrice,
    price: STANDARD_PLAN.price,
    savings: 30,
    features: [
      'Acesso total ao Compositor',
      'Biblioteca completa de Bases Musicais',
      'Cifrador avançado',
      'Rascunhos ilimitados',
      'Organizador de pastas',
      'Sistema de Parcerias',
      STANDARD_ALLOWANCE_DESCRIPTION,
      'Tutoriais exclusivos',
      'Suporte prioritário',
      'Certificados profissionais',
    ]
  };

  // Função para verificar o status do pagamento
  const checkPaymentStatus = async (useSimulation = false) => {
    if (!paymentId) return;

    try {
      setIsCheckingPayment(true);
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { 
          paymentId,
          simulate: useSimulation
        }
      });

      if (error) {
        console.error('Erro ao verificar pagamento:', error);
        toast.error(`Erro na requisição: ${error.message || 'Erro desconhecido'}`);
        return;
      }

      console.log('Status do pagamento:', data);

      // Verificar se houve erro na resposta
      if (data?.success === false) {
        console.error('Erro na verificação:', data.error);
        toast.error(`Erro: ${data.error || 'Falha na verificação'}`);
        return;
      }

      if (data?.isPaid) {
        setPaymentConfirmed(true);
        setIsCheckingPayment(false);
        
        // Mostrar mensagem de sucesso
        toast.success('🎉 Pagamento confirmado! Bem-vindo ao Pro!');
        
        // Atualizar subscription
        await refreshSubscription();
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        // Se for simulação e não deu certo, mostrar erro específico
        if (useSimulation) {
          toast.error('Simulação de pagamento falhou. Verifique a configuração da API.');
        } else {
          // Mostrar status atual do pagamento apenas se não for simulação
          console.log('Pagamento ainda não confirmado:', {
            paymentId,
            status: data?.paymentStatus,
            isPaid: data?.isPaid,
            expiresAt: data?.expiresAt
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Effect para verificar pagamento periodicamente quando QR code está sendo exibido
  useEffect(() => {
    if (showQRCode && paymentId && !paymentConfirmed) {
      // Verificar a cada 5 segundos
      const interval = setInterval(() => checkPaymentStatus(false), 5000);
      
      return () => clearInterval(interval);
    }
  }, [showQRCode, paymentId, paymentConfirmed]);

  // Verificar se usuário pode fazer checkout
  if (!profile?.name || !profile?.cpf || !profile?.email || !profile?.cellphone) {
    return (
      <ResponsiveContainer>
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Dados Incompletos</h1>
            <p className="text-muted-foreground">
              Para prosseguir com a assinatura Plano Padrão, você precisa completar suas informações de perfil.
            </p>
            <div className="space-y-2">
              {!profile?.name && <p className="text-sm text-red-500">• Nome completo é obrigatório</p>}
              {!profile?.cpf && <p className="text-sm text-red-500">• CPF é obrigatório</p>}
              {!profile?.email && <p className="text-sm text-red-500">• Email é obrigatório</p>}
              {!profile?.cellphone && <p className="text-sm text-red-500">• Telefone é obrigatório</p>}
            </div>
            <Button onClick={() => navigate('/settings')}>
              Completar Perfil
            </Button>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  // Se já é Pro ativo
  if (subscription?.plan_type === 'pro' && subscription?.status === 'active') {
    return (
      <ResponsiveContainer>
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div className="text-center space-y-4">
            <Crown className="h-16 w-16 text-yellow-500 mx-auto" />
            <h1 className="text-2xl font-bold">Você já possui o Plano Padrão!</h1>
            <p className="text-muted-foreground">
              Sua assinatura Plano Padrão está ativa até {subscription.expires_at ? 
                new Date(subscription.expires_at).toLocaleDateString() : 'prazo indeterminado'}.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  // Se pagamento foi confirmado, mostrar tela de sucesso
  if (paymentConfirmed) {
    return (
      <ResponsiveContainer>
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              </div>
              <CardTitle className="text-2xl text-green-600">Parabéns!</CardTitle>
              <CardDescription className="text-lg">
                Pagamento confirmado com sucesso!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Você agora é Pro! 🎉</h3>
                <p className="text-muted-foreground">
                  Todas as funcionalidades premium foram liberadas em sua conta.
                  Você será redirecionado para o dashboard em instantes.
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecionando para o dashboard...
              </div>
            </CardContent>
          </Card>
        </div>
      </ResponsiveContainer>
    );
  }

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      console.log('Iniciando processo de pagamento...', {
        user_data: {
          name: profile.name,
          email: profile.email,
          cpf: profile.cpf,
          cellphone: profile.cellphone,
        },
        plan: {
          name: planDetails.name,
          price: planDetails.price,
          currency: 'BRL'
        }
      });

      // Chamar edge function da Abacate Pay
      const { data, error } = await supabase.functions.invoke('create-abacate-subscription', {
        body: {
          user_data: {
            name: profile.name,
            email: profile.email,
            cpf: profile.cpf,
            cellphone: profile.cellphone,
          },
          plan: {
            name: planDetails.name,
            price: planDetails.price,
            currency: 'BRL'
          }
        }
      });

      console.log('Resposta da edge function:', { data, error });

      if (error) {
        console.error('Erro da edge function:', error);
        throw error;
      }

      if (data?.success && data?.pix_data) {
        console.log('PIX data recebido:', data.pix_data);
        setPixData(data.pix_data);
        setPaymentId(data.pix_data.id);
        setShowQRCode(true);
        toast.success('QR Code PIX gerado com sucesso!');
      } else {
        console.error('Resposta inesperada:', data);
        throw new Error(data?.error || 'Erro ao processar pagamento');
      }
      
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error(`Erro ao processar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Se QR Code deve ser exibido
  if (showQRCode && pixData) {
    return (
      <ResponsiveContainer>
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">PIX para Pagamento</CardTitle>
              <CardDescription className="text-center">
                Escaneie o QR Code abaixo para pagar sua assinatura Plano Padrão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <img 
                  src={pixData.brCodeBase64} 
                  alt="QR Code PIX" 
                  className="max-w-xs border rounded-lg"
                />
              </div>
              
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">
                  Valor: R$ {(pixData.amount / 100).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Expira em: {new Date(pixData.expiresAt).toLocaleString('pt-BR')}
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(pixData.brCode);
                    toast.success('Código PIX copiado!');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Copiar código PIX
                </Button>
                
                <Button 
                  onClick={() => checkPaymentStatus(true)}
                  variant="secondary"
                  className="w-full"
                  disabled={isCheckingPayment}
                >
                  {isCheckingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando pagamento...
                    </>
                  ) : (
                    "Já paguei"
                  )}
                </Button>
              </div>
              
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm">
                  {isCheckingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-blue-600">Verificando pagamento...</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Aguardando pagamento</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Após o pagamento, você será redirecionado automaticamente
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/plans')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Planos
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Finalizar Assinatura</h1>
          <p className="text-muted-foreground">
            Você está prestes a se tornar um assinante do Plano Padrão!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Resumo do Plano */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Plano Padrão
              </CardTitle>
              <CardDescription>
                Oferta especial de lançamento por tempo limitado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preço */}
              <div className="text-center space-y-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="line-through">De R$ {planDetails.originalPrice.toFixed(2)}</span>
                  </p>
                  <p className="text-4xl font-bold">
                    R$ {planDetails.price.toFixed(2)}
                    <span className="text-lg font-normal text-muted-foreground">/mês</span>
                  </p>
                  <Badge variant="secondary" className="text-green-600">
                    Economize R$ {planDetails.savings.toFixed(2)}/mês
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Features */}
              <div className="space-y-4">
                <h4 className="font-semibold">O que você vai ter:</h4>
                <ul className="space-y-3">
                  {planDetails.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Dados e Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Dados da Assinatura
              </CardTitle>
              <CardDescription>
                Confirme suas informações e finalize
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dados do Usuário */}
              <div className="space-y-4">
                <h4 className="font-semibold">Seus dados:</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Nome:</span> {profile.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {profile.email}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">CPF:</span> {profile.cpf}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Telefone:</span> {profile.cellphone}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/settings')}
                >
                  Alterar dados
                </Button>
              </div>

              <Separator />

              {/* Resumo Financeiro */}
              <div className="space-y-3">
                <h4 className="font-semibold">Resumo financeiro:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Plano Padrão (mensal)</span>
                    <span className="line-through text-muted-foreground">R$ {planDetails.originalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto de lançamento</span>
                    <span>-R$ {planDetails.savings.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total mensal:</span>
                    <span>R$ {planDetails.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Botão de Pagamento */}
              <div className="space-y-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Finalizar Assinatura
                    </>
                  )}
                </Button>
                
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Pagamento processado de forma segura via Abacate Pay
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Novo pagamento a cada 30 dias, sem acúmulo da franquia.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveContainer>
  );
};

export default Checkout;