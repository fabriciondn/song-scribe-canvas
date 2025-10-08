import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Award, 
  Link, 
  Target,
  Calendar,
  Copy
} from 'lucide-react';
import { useAffiliate } from '@/hooks/useAffiliate';
import { AffiliateMetrics } from '@/components/affiliate/AffiliateMetrics';
import { AffiliateLinks } from '@/components/affiliate/AffiliateLinks';
import { AffiliateCampaigns } from '@/components/affiliate/AffiliateCampaigns';
import { AffiliateCommissions } from '@/components/affiliate/AffiliateCommissions';
import { AffiliateAchievements } from '@/components/affiliate/AffiliateAchievements';
import { AffiliateWithdrawals } from '@/components/affiliate/AffiliateWithdrawals';
import { AffiliateApplication } from '@/components/affiliate/AffiliateApplication';
import { AffiliateSidebar } from '@/components/affiliate/AffiliateSidebar';
import { toast } from '@/hooks/use-toast';

export default function AffiliateDashboard() {
  const { affiliate, stats, isLoading, isAffiliate, isPending, isRejected } = useAffiliate();
  const [activeSection, setActiveSection] = useState('overview');

  // Extract last part of affiliate code for shorter link
  const getShortCode = (code: string) => {
    const parts = code.split('-');
    if (parts.length >= 3) {
      // Get last UUID part and name part
      return `-${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
    }
    return code;
  };
  
  const affiliateLink = affiliate ? `https://compuse.com.br${getShortCode(affiliate.affiliate_code)}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    toast({
      title: "Link copiado!",
      description: "O link de afiliado foi copiado para a área de transferência.",
    });
  };

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

  return (
    <div className="flex min-h-screen w-full">
      <AffiliateSidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        affiliate={affiliate}
      />
      
      <main className="flex-1 ml-64 p-6 md:p-8 space-y-6 overflow-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Painel do Afiliado</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas campanhas e acompanhe seus ganhos
          </p>
        </div>

        {/* Link Principal do Afiliado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Link className="w-4 h-4" />
              Seu Link Principal
            </CardTitle>
            <CardDescription className="text-xs">
              Use este link para compartilhar e ganhar comissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <code className="text-xs font-mono truncate mr-2">{affiliateLink}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                <Copy className="w-3 h-3 mr-1" />
                <span className="text-xs">Copiar</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Métricas Principais */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium">Total de Ganhos</CardTitle>
                <DollarSign className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  R$ {stats.total_earnings.toFixed(2)}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  +R$ {stats.this_month_earnings.toFixed(2)} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium">Taxa de Conversão</CardTitle>
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {stats.conversion_rate.toFixed(1)}%
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {stats.total_conversions} de {stats.total_clicks} cliques
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium">Registros Indicados</CardTitle>
                <Users className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {stats.registrations_count}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {affiliate.level === 'bronze' ? `${Math.max(0, 5 - stats.registrations_count)} para 50% comissão` : '50% de comissão'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium">A Receber</CardTitle>
                <Target className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  R$ {stats.pending_earnings.toFixed(2)}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Comissões pendentes
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Sections */}
        <div>
          {activeSection === 'overview' && <AffiliateMetrics />}
          {activeSection === 'links' && <AffiliateLinks affiliateCode={affiliate.affiliate_code} />}
          {activeSection === 'campaigns' && <AffiliateCampaigns />}
          {activeSection === 'commissions' && <AffiliateCommissions />}
          {activeSection === 'withdrawals' && <AffiliateWithdrawals />}
          {activeSection === 'achievements' && <AffiliateAchievements affiliate={affiliate} />}
        </div>
      </main>
    </div>
  );
}