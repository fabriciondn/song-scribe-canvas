import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Award, 
  Link, 
  BarChart3, 
  Target,
  Calendar,
  Trophy,
  Star
} from 'lucide-react';
import { useAffiliate } from '@/hooks/useAffiliate';
import { AffiliateMetrics } from '@/components/affiliate/AffiliateMetrics';
import { AffiliateLinks } from '@/components/affiliate/AffiliateLinks';
import { AffiliateCampaigns } from '@/components/affiliate/AffiliateCampaigns';
import { AffiliateCommissions } from '@/components/affiliate/AffiliateCommissions';
import { AffiliateAchievements } from '@/components/affiliate/AffiliateAchievements';
import { AffiliateWithdrawals } from '@/components/affiliate/AffiliateWithdrawals';
import { AffiliateApplication } from '@/components/affiliate/AffiliateApplication';

export default function AffiliateDashboard() {
  const { affiliate, stats, isLoading, isAffiliate, isPending, isRejected } = useAffiliate();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return <AffiliateApplication />;
  }

  if (isPending) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-warning" />
            </div>
            <CardTitle>Solicitação em Análise</CardTitle>
            <CardDescription>
              Sua solicitação para se tornar afiliado está sendo analisada pela nossa equipe.
              Você receberá uma notificação quando for aprovada.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="secondary" className="mb-4">
              Status: Pendente
            </Badge>
            <p className="text-sm text-muted-foreground">
              Tempo médio de análise: 1-3 dias úteis
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Solicitação Rejeitada</CardTitle>
            <CardDescription>
              Infelizmente sua solicitação para se tornar afiliado foi rejeitada.
              Entre em contato conosco para mais informações.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="destructive" className="mb-4">
              Status: Rejeitada
            </Badge>
            <Button variant="outline">
              Entrar em Contato
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getLevelBadge = (level: string) => {
    const levels = {
      bronze: { color: 'bg-orange-500', icon: Star },
      silver: { color: 'bg-gray-400', icon: Trophy },
      gold: { color: 'bg-yellow-500', icon: Award }
    };
    
    const levelInfo = levels[level as keyof typeof levels];
    const Icon = levelInfo.icon;
    
    return (
      <Badge className={`${levelInfo.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {level.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Painel do Afiliado</h1>
          <p className="text-muted-foreground">
            Gerencie suas campanhas e acompanhe seus ganhos
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getLevelBadge(affiliate.level)}
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Ativo
          </Badge>
        </div>
      </div>

      {/* Código do Afiliado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Seu Código de Afiliado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <code className="text-lg font-mono">{affiliate.affiliate_code}</code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(affiliate.affiliate_code)}
            >
              Copiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Ganhos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.total_earnings.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                +R$ {stats.this_month_earnings.toFixed(2)} este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.conversion_rate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.total_conversions} de {stats.total_clicks} cliques
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros Indicados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.registrations_count}
              </div>
              <p className="text-xs text-muted-foreground">
                {affiliate.level === 'bronze' ? `${5 - stats.registrations_count} para Silver` : 'Meta atingida'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Receber</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.pending_earnings.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Comissões pendentes
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="withdrawals">Saques</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AffiliateMetrics />
        </TabsContent>

        <TabsContent value="links">
          <AffiliateLinks affiliateCode={affiliate.affiliate_code} />
        </TabsContent>

        <TabsContent value="campaigns">
          <AffiliateCampaigns />
        </TabsContent>

        <TabsContent value="commissions">
          <AffiliateCommissions />
        </TabsContent>

        <TabsContent value="withdrawals">
          <AffiliateWithdrawals />
        </TabsContent>

        <TabsContent value="achievements">
          <AffiliateAchievements affiliate={affiliate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}