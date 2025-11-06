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
import { AffiliateReferrals } from '@/components/affiliate/AffiliateReferrals';
import { AffiliateSidebar } from '@/components/affiliate/AffiliateSidebar';
import { AffiliateMobileLayout } from '@/components/affiliate/AffiliateMobileLayout';
import { useMobileDetection } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { useAdminAccess } from '@/hooks/useAdminAccess';

export default function AffiliateDashboard() {
  const { affiliate, stats, isLoading, isAffiliate, isPending, isRejected } = useAffiliate();
  const { isAdmin } = useAdminAccess();
  const [activeSection, setActiveSection] = useState('overview');
  const { isMobile } = useMobileDetection();

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
      description: "O link de parceiro foi copiado para a área de transferência.",
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

  // Administradores sempre veem o painel completo
  if (!affiliate && !isAdmin) {
    return <AffiliateApplication />;
  }

  // Se for admin mas não tem afiliado, mostrar aviso amigável
  if (!affiliate && isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Visualizando como Administrador</CardTitle>
            <CardDescription>
              Você está acessando o painel de afiliados como administrador.
              Use o botão "Operar como" na lista de afiliados para visualizar dados de um afiliado específico.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isPending && !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-warning" />
            </div>
            <CardTitle>Solicitação em Análise</CardTitle>
            <CardDescription>
              Sua solicitação para se tornar parceiro está sendo analisada pela nossa equipe.
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

  if (isRejected && !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Solicitação Rejeitada</CardTitle>
            <CardDescription>
              Infelizmente sua solicitação para se tornar parceiro foi rejeitada.
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

  // Mobile Layout
  if (isMobile) {
    return (
      <AffiliateMobileLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        affiliate={affiliate}
      >
        {/* Content Sections */}
        <div className="space-y-4">
          {activeSection === 'overview' && (
            <>
              {/* Métricas Financeiras Principais - Mobile */}
              {affiliate && (
                <div className="space-y-3 mb-6">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-300">Total Ganho</p>
                          <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-2">
                            R$ {(affiliate.total_earnings || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                            {stats && `+R$ ${stats.this_month_earnings.toFixed(2)} este mês`}
                          </p>
                        </div>
                        <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">A Receber</p>
                          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-2">
                            R$ {Math.max(0, (affiliate.total_earnings || 0) - (affiliate.total_paid || 0)).toFixed(2)}
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                            Comissões pendentes
                          </p>
                        </div>
                        <Target className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Já Recebido</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                            R$ {(affiliate.total_paid || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            Total de comissões pagas
                          </p>
                        </div>
                        <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <AffiliateMetrics />
            </>
          )}
          {activeSection === 'referrals' && <AffiliateReferrals />}
          {activeSection === 'links' && <AffiliateLinks affiliateCode={affiliate.affiliate_code} affiliate={affiliate} />}
          {activeSection === 'campaigns' && <AffiliateCampaigns />}
          {activeSection === 'commissions' && <AffiliateCommissions />}
          {activeSection === 'withdrawals' && <AffiliateWithdrawals />}
          {activeSection === 'achievements' && <AffiliateAchievements affiliate={affiliate} />}
        </div>
      </AffiliateMobileLayout>
    );
  }

  // Desktop Layout
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
          <h1 className="text-2xl font-bold">Painel do Parceiro</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas campanhas e acompanhe seus ganhos
          </p>
        </div>

        {/* Content Sections */}
        <div>
          {activeSection === 'overview' && (
            <>
              {/* Métricas Financeiras Principais - DESTAQUE */}
              {affiliate && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-300">Total Ganho</p>
                          <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                            R$ {(affiliate.total_earnings || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                            {stats && `+R$ ${stats.this_month_earnings.toFixed(2)} este mês`}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">A Receber</p>
                          <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mt-2">
                            R$ {Math.max(0, (affiliate.total_earnings || 0) - (affiliate.total_paid || 0)).toFixed(2)}
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                            Comissões pendentes
                          </p>
                        </div>
                        <Target className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Já Recebido</p>
                          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                            R$ {(affiliate.total_paid || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            Total de comissões pagas
                          </p>
                        </div>
                        <Award className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <AffiliateMetrics />
            </>
          )}
          {activeSection === 'referrals' && <AffiliateReferrals />}
          {activeSection === 'links' && <AffiliateLinks affiliateCode={affiliate.affiliate_code} affiliate={affiliate} />}
          {activeSection === 'campaigns' && <AffiliateCampaigns />}
          {activeSection === 'commissions' && <AffiliateCommissions />}
          {activeSection === 'withdrawals' && <AffiliateWithdrawals />}
          {activeSection === 'achievements' && <AffiliateAchievements affiliate={affiliate} />}
        </div>
      </main>
    </div>
  );
}