
import { useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeratorSidebar } from './ModeratorSidebar';
import { useModeratorAccess } from '@/hooks/useModeratorAccess';
import { useUserCredits } from '@/hooks/useUserCredits';
import { ImpersonationBanner } from '@/components/ui/impersonation-banner';

// Lazy loading dos componentes para evitar problemas de carregamento
import { lazy } from 'react';

const ModeratorOverview = lazy(() => 
  import('./ModeratorOverview').then(module => ({ default: module.ModeratorOverview }))
);
const ModeratorUsers = lazy(() => 
  import('./ModeratorUsers').then(module => ({ default: module.ModeratorUsers }))
);
const ModeratorProfile = lazy(() => 
  import('./ModeratorProfile').then(module => ({ default: module.ModeratorProfile }))
);
const ModeratorTransactions = lazy(() => 
  import('./ModeratorTransactions').then(module => ({ default: module.ModeratorTransactions }))
);
const ModeratorUpdates = lazy(() => 
  import('./ModeratorUpdates').then(module => ({ default: module.ModeratorUpdates }))
);

// Componente de loading
const LoadingComponent = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Carregando...</span>
    </div>
  </div>
);

interface ModeratorDashboardProps {
  activeTab?: string;
}

export const ModeratorDashboard = ({ activeTab = 'overview' }: ModeratorDashboardProps) => {
  const navigate = useNavigate();
  const { isModerator, isLoading } = useModeratorAccess();
  const { credits, isLoading: creditsLoading } = useUserCredits();
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Determinar qual tab mostrar baseado na URL
  useEffect(() => {
    const path = window.location.pathname;
    console.log('🔍 Determinando tab baseado na URL:', path);
    
    if (path.includes('/users')) {
      setCurrentTab('users');
    } else if (path.includes('/transactions')) {
      setCurrentTab('transactions');
    } else if (path.includes('/profile')) {
      setCurrentTab('profile');
    } else if (path.includes('/updates')) {
      setCurrentTab('updates');
    } else {
      setCurrentTab('overview');
    }
  }, []);

  // Verificação de acesso simplificada
  useEffect(() => {
    console.log('🔍 ModeratorDashboard - Estado:', { isModerator, isLoading });
    
    if (!isLoading && !isModerator) {
      console.log('❌ Redirecionando para dashboard principal');
      navigate('/dashboard', { replace: true });
    }
  }, [isModerator, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg font-medium text-foreground">Verificando permissões...</div>
          <div className="text-sm text-muted-foreground">Aguarde um momento</div>
        </div>
      </div>
    );
  }

  if (!isModerator) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar o painel de moderação.</p>
        </div>
      </div>
    );
  }


  const renderActiveTab = () => {
    console.log('🎯 Renderizando tab:', currentTab);
    
    try {
      switch (currentTab) {
        case 'users':
          return (
            <Suspense fallback={<LoadingComponent />}>
              <ModeratorUsers />
            </Suspense>
          );
        case 'transactions':
          return (
            <Suspense fallback={<LoadingComponent />}>
              <ModeratorTransactions />
            </Suspense>
          );
        case 'profile':
          return (
            <Suspense fallback={<LoadingComponent />}>
              <ModeratorProfile />
            </Suspense>
          );
        case 'updates':
          return (
            <Suspense fallback={<LoadingComponent />}>
              <ModeratorUpdates />
            </Suspense>
          );
        case 'overview':
        default:
          return (
            <Suspense fallback={<LoadingComponent />}>
              <ModeratorOverview />
            </Suspense>
          );
      }
    } catch (error) {
      console.error('❌ Erro ao renderizar tab:', error);
      return (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-destructive mb-2">Erro ao carregar conteúdo</h3>
              <p className="text-muted-foreground">Houve um problema ao carregar esta seção. Tente recarregar a página.</p>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ModeratorSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">Dashboard do Moderador</h1>
              <Badge variant="secondary" className="text-xs">
                Sistema de Moderação
              </Badge>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              {/* Créditos e Recarga */}
              <Card className="px-3 py-1">
                <div className="flex items-center space-x-2">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Meus Créditos</div>
                    <div className="text-sm font-bold">
                      {creditsLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin inline" />
                      ) : (
                        credits || 0
                      )}
                    </div>
                  </div>
                </div>
              </Card>
              <Button 
                onClick={() => navigate('/moderator/recharge')}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Recarga
              </Button>
            </div>
          </header>

          <main className="flex-1 space-y-4 p-4 md:p-8 bg-background min-h-[calc(100vh-4rem)]">
            <ImpersonationBanner />
            <div className="w-full">
              {renderActiveTab()}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
