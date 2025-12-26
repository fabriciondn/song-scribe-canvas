import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfile } from '@/hooks/useProfile';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const Plans = () => {
  const navigate = useNavigate();
  const { subscription, isLoading } = useSubscription();
  const { profile } = useProfile();

  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      description: 'Para começar sua jornada musical',
      icon: Star,
      features: [
        'Dashboard pessoal',
        'Registro autoral (usa créditos)',
        'Ranking de compositores',
        'Minhas Compras',
        'Configurações de perfil',
      ],
      limitations: [
        'Sem acesso ao Compositor',
        'Sem acesso às Bases Musicais',
        'Sem acesso ao Cifrador',
        'Sem acesso às Pastas',
        'Sem créditos mensais',
      ],
      buttonText: subscription?.plan_type === 'free' ? 'Plano Atual' : 'Gratuito',
      isPopular: false,
      current: subscription?.plan_type === 'free' || !subscription
    },
    {
      id: 'pro',
      name: 'Plano Pro',
      price: 30,
      description: 'Todos os recursos para profissionais',
      icon: Crown,
      features: [
        'Tudo do plano Gratuito',
        '2 créditos garantidos por mês',
        '+1 crédito de bônus mensal',
        'Acesso total ao Compositor',
        'Biblioteca completa de Bases Musicais',
        'Cifrador avançado',
        'Organizador de pastas',
        'Rascunhos ilimitados',
        'Sistema de Parcerias',
        'Tutoriais exclusivos',
        'Suporte prioritário',
      ],
      highlight: 'Bônus só disponíveis com assinatura em dia. Congelam se inativo e expiram após 2 meses.',
      buttonText: subscription?.plan_type === 'pro' && subscription?.status === 'active' 
        ? 'Plano Atual' 
        : 'Assinar Pro',
      isPopular: true,
      current: subscription?.plan_type === 'pro' && subscription?.status === 'active'
    }
  ];

  const [showProfileWarning, setShowProfileWarning] = React.useState(false);
  const handleUpgrade = () => {
    if (!profile?.name || !profile?.cpf || !profile?.email) {
      setShowProfileWarning(true);
      return;
    }
    navigate('/subscription-checkout');
  };

  if (isLoading) {
    return (
      <ResponsiveContainer>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Escolha seu Plano</h1>
          <p className="text-xl text-muted-foreground">
            Libere todo o potencial da plataforma musical
          </p>
          {showProfileWarning && (
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md px-4 py-3 max-w-xl mx-auto flex flex-col items-center gap-3">
              <span>Complete seu perfil antes de fazer o upgrade para Pro. Precisamos do seu nome completo, CPF e email.</span>
              <Button onClick={() => navigate('/dashboard/settings')} variant="default">
                Completar perfil
              </Button>
            </div>
          )}
          {subscription && (
            <div className="flex justify-center">
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                Plano Atual: {subscription.plan_type} 
                {subscription.status === 'active' && subscription.expires_at && 
                  ` - Expira em ${new Date(subscription.expires_at).toLocaleDateString()}`
                }
              </Badge>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            const isCurrent = plan.current;
            
            return (
              <Card 
                key={plan.id} 
                className={cn(
                  "relative transition-all duration-200",
                  plan.isPopular && "border-primary shadow-lg scale-105",
                  isCurrent && "bg-muted/50"
                )}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Zap className="w-3 h-3 mr-1" />
                      Oferta de Lançamento
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <IconComponent className={cn(
                      "h-6 w-6",
                      plan.id === 'pro' ? "text-yellow-500" : "text-primary"
                    )} />
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      {plan.price === 0 ? (
                        'Grátis'
                      ) : (
                        <>
                          <span>R$ {plan.price.toFixed(2)}</span>
                          <span className="text-sm font-normal text-muted-foreground">/mês</span>
                        </>
                      )}
                    </div>
                    {plan.id === 'pro' && (
                      <p className="text-sm text-green-600 font-semibold">
                        2 créditos + 1 bônus mensal
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Incluso:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground">Limitações:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-red-400">✕</span>
                            <span>{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {'highlight' in plan && plan.highlight && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-700">{plan.highlight}</p>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    variant={plan.isPopular ? "default" : "outline"}
                    size="lg"
                    disabled={isCurrent}
                    onClick={plan.id === 'pro' ? handleUpgrade : undefined}
                  >
                    {plan.isPopular && !isCurrent && <Crown className="mr-2 h-4 w-4" />}
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center space-y-4 pt-8">
          <h3 className="text-2xl font-bold">Por que escolher o Pro?</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">Ferramentas Profissionais</h4>
              <p className="text-sm text-muted-foreground">
                Acesso completo a todas as ferramentas de composição e produção
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">Sem Limitações</h4>
              <p className="text-sm text-muted-foreground">
                Crie quantas músicas, rascunhos e projetos quiser
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">Suporte Premium</h4>
              <p className="text-sm text-muted-foreground">
                Atendimento prioritário e tutoriais exclusivos
              </p>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
};

export default Plans;