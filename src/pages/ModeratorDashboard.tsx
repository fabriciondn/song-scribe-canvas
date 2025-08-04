import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { ModeratorSidebar } from '@/components/moderator/ModeratorSidebar';
import { ModeratorOverview } from '@/components/moderator/ModeratorOverview';
import { ModeratorUsers } from '@/components/moderator/ModeratorUsers';
import { useRoleBasedNavigation } from '@/hooks/useRoleBasedNavigation';
import { useUserCredits } from '@/hooks/useUserCredits';
import { ImpersonationBanner } from '@/components/ui/impersonation-banner';
const ModeratorDashboard = () => {
  const navigate = useNavigate();
  const { canAccess, isRoleLoading } = useRoleBasedNavigation();
  const { credits } = useUserCredits();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth] = useState({
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy'
  });

  useEffect(() => {
    console.log('🔍 ModeratorDashboard - Verificando acesso...');
    console.log('📊 Estado:', { canAccess: canAccess('moderator'), isRoleLoading });
    
    if (!isRoleLoading && !canAccess('moderator')) {
      console.log('❌ Usuário não tem acesso de moderador, redirecionando...');
      navigate('/dashboard');
    }
  }, [canAccess, isRoleLoading, navigate]);

  // Determinar qual tab mostrar baseado na URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/users')) {
      setActiveTab('users');
    } else {
      setActiveTab('overview');
    }
  }, []);

  if (isRoleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mb-4"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!canAccess('moderator')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      default:
        return 'text-red-500 bg-red-50 border-red-200';
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'users':
        return <ModeratorUsers />;
      default:
        return <ModeratorOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ModeratorSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Dashboard do Moderador</h1>
              <Badge variant="secondary" className="text-xs">
                Sistema de Moderação
              </Badge>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              {/* Status do Sistema */}
              <div className="flex items-center space-x-1">
                {getStatusIcon(systemHealth.database)}
                <span className="text-xs text-muted-foreground">DB</span>
              </div>
              <div className="flex items-center space-x-1">
                {getStatusIcon(systemHealth.api)}
                <span className="text-xs text-muted-foreground">API</span>
              </div>
              <div className="flex items-center space-x-1">
                {getStatusIcon(systemHealth.storage)}
                <span className="text-xs text-muted-foreground">Storage</span>
              </div>
              
              {/* Métricas Rápidas */}
              <Card className="px-3 py-1">
                <div className="flex items-center space-x-2">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Meus Créditos</div>
                    <div className="text-sm font-bold">{credits || 0}</div>
                  </div>
                </div>
              </Card>
            </div>
          </header>

          <main className="flex-1 space-y-4 p-4 md:p-8">
            <ImpersonationBanner />
            {renderActiveTab()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ModeratorDashboard;