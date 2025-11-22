
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ImpersonationBanner } from '@/components/ui/impersonation-banner';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedNavigation } from '@/hooks/useRoleBasedNavigation';
import { useImpersonation } from '@/context/ImpersonationContext';
import { useToast } from '@/hooks/use-toast';
import { useMobileDetection } from '@/hooks/use-mobile';
import { useImpersonationSync } from '@/hooks/useImpersonationSync';
import { useRegionalAuth } from '@/hooks/useRegionalAuth';
import { cn } from '@/lib/utils';

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { userRole, isRoleLoading } = useRoleBasedNavigation();
  const { isImpersonating } = useImpersonation();
  const { isMobile } = useMobileDetection();
  const { reportAuthIssue } = useRegionalAuth(); // Monitor de problemas regionais
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Usar o hook para sincronizar impersonação entre abas
  useImpersonationSync();

  console.log('🏠 Dashboard - Role check:', { userRole, isRoleLoading });

  // Redirecionar moderador para /moderator após login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/', { replace: true });
      toast({
        title: 'Acesso restrito',
        description: 'Você precisa estar logado para acessar esta área.',
        variant: 'destructive',
      });
      return;
    }
    // Só redireciona moderador se NÃO estiver impersonando
    if (!isRoleLoading && userRole?.role === 'moderator' && !isImpersonating) {
      navigate('/moderator', { replace: true });
    }
  }, [isAuthenticated, isLoading, userRole, isRoleLoading, isImpersonating, navigate, toast]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Layout mobile otimizado
  if (isMobile) {
    return (
      <MobileLayout toggleSidebar={toggleSidebar}>
        <div className="p-4">
          <Outlet />
        </div>
      </MobileLayout>
    );
  }

  // Layout desktop com header fixo
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        toggleSidebar={toggleSidebar} 
        isSidebarOpen={isSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      
      <div className="flex flex-1 pt-16 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar}
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={toggleSidebarCollapse}
        />
        
        <main className={cn(
          "flex-1 p-6 transition-all duration-200 overflow-y-auto",
          isSidebarOpen && !isSidebarCollapsed && "lg:pl-64",
          isSidebarOpen && isSidebarCollapsed && "lg:pl-16"
        )}>
          <ImpersonationBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
