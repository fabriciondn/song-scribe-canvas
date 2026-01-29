import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminRoles } from '@/components/admin/AdminRoles';
import { AdminAffiliates } from '@/components/admin/AdminAffiliates';
import { AdminContent } from '@/components/admin/AdminContent';
import { AdminTutorials } from '@/components/admin/AdminTutorials';
import { AdminBanners } from '@/components/admin/AdminBanners';
import { AdminCertificates } from '@/components/admin/AdminCertificates';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminOfferAnalytics } from '@/components/admin/AdminOfferAnalytics';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminLogs } from '@/components/admin/AdminLogs';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminModerators } from '@/components/admin/AdminModerators';
import { AdminMenuFunctions } from '@/components/admin/AdminMenuFunctions';
import { AdminForms } from '@/components/admin/AdminForms';
import { AdminAffiliateWithdrawals } from '@/components/admin/AdminAffiliateWithdrawals';
import { AdminCoupons } from '@/components/admin/AdminCoupons';
import { AdminGamification } from '@/components/admin/AdminGamification';
import { AdminRaffle } from '@/components/admin/AdminRaffle';
import { OnlineVisitorsPanel } from '@/components/admin/OnlineVisitorsPanel';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { Shield, Users, BarChart3, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { isAdmin, isLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    uptime: '99.9%',
    activeUsers: 0,
    responseTime: '120ms'
  });
  
  const { profile } = useProfile();

  useEffect(() => {
    if (!isLoading && isAdmin) {
      console.log('✅ AdminDashboard: Usuário confirmado como admin');
      
      // Simular dados de saúde do sistema
      setSystemHealth({
        status: 'healthy',
        uptime: '99.9%',
        activeUsers: Math.floor(Math.random() * 50) + 10,
        responseTime: Math.floor(Math.random() * 50) + 100 + 'ms'
      });
    }
  }, [isAdmin, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verificando permissões de administrador...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    console.log('❌ AdminDashboard: Usuário não é admin, redirecionando...');
    return <Navigate to="/dashboard" replace />;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'online-visitors':
        return <OnlineVisitorsPanel />;
      case 'users':
        return <AdminUsers />;
      case 'moderators':
        return <AdminModerators />;
      case 'roles':
        return <AdminRoles />;
      case 'affiliates':
        return <AdminAffiliates />;
      case 'affiliate-withdrawals':
        return <AdminAffiliateWithdrawals />;
      case 'coupons':
        return <AdminCoupons />;
      case 'gamification':
        return <AdminGamification />;
      case 'raffle':
        return <AdminRaffle />;
      case 'content':
        return <AdminContent />;
      case 'tutorials':
        return <AdminTutorials />;
      case 'banners':
        return <AdminBanners />;
      case 'certificates':
        return <AdminCertificates />;
      case 'forms':
        return <AdminForms />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'offer-analytics':
        return <AdminOfferAnalytics />;
      case 'logs':
        return <AdminLogs />;
      case 'menu-functions':
        return <AdminMenuFunctions />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar como drawer/hamburguer no mobile */}
        <div className="fixed z-40 md:static md:z-auto">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <SidebarInset className="flex-1">
          {/* Header + Status do Sistema */}
          <header className="flex flex-col gap-2 md:gap-0 md:flex-row h-auto md:h-16 shrink-0 items-start md:items-center border-b px-2 md:px-4 bg-background sticky top-0 z-30">
            <div className="flex items-center space-x-2 flex-1 py-2 md:py-0">
              <Shield className="h-7 w-7 text-primary" />
              <div>
                <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Painel Administrativo
                </h1>
                <p className="text-xs text-muted-foreground">Sistema de Gestão Compuse</p>
              </div>
            </div>
            {/* Status do Sistema - topo, sem card */}
            <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-end w-full md:w-auto py-2 md:py-0">
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-background/80 border text-blue-700 text-xs font-medium">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span>Resposta Média:</span>
                <span className="font-bold text-blue-900">{systemHealth.responseTime}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-background/80 border text-green-700 text-xs font-medium">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Uptime:</span>
                <span className="font-bold text-green-900">{systemHealth.uptime}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-background/80 border text-purple-700 text-xs font-medium">
                <Users className="h-4 w-4 text-purple-600" />
                <span>Usuários Online:</span>
                <span className="font-bold text-purple-900">{systemHealth.activeUsers}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-background/80 border text-orange-700 text-xs font-medium">
                <Shield className="h-4 w-4 text-orange-600" />
                <span>Status:</span>
                <span className="font-bold text-orange-900">Operacional</span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="w-8 h-8 cursor-pointer">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                  <AvatarFallback>
                    {profile?.name?.slice(0, 2).toUpperCase() || 'AD'}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">Painel Usuário</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          {/* Conteúdo Principal */}
          <main className="flex-1 p-2 md:p-6 bg-gradient-to-br from-background to-secondary/20">
            <div className="space-y-4 md:space-y-6">
              {/* Conteúdo da Aba Ativa */}
              <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CardContent className="p-2 md:p-6">
                  {renderActiveTab()}
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
