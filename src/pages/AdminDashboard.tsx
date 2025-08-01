import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminContent } from '@/components/admin/AdminContent';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminLogs } from '@/components/admin/AdminLogs';
import { Shield, Users, FileText, BarChart3, Settings, AlertTriangle, CheckCircle, Clock, Activity, ScrollText } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    uptime: '99.9%',
    activeUsers: 0,
    responseTime: '120ms'
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('🔍 AdminDashboard: Verificando status de admin...');
      
      try {
        // Verificar se há usuário autenticado
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('📊 Sessão atual:', { session: !!session, user: session?.user?.id });
        
        if (sessionError || !session?.user) {
          console.log('❌ Nenhuma sessão ativa encontrada');
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // Verificar se o usuário é admin
        const { data, error } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        console.log('📋 Resultado da verificação admin:', { data, error });
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
          console.error('❌ Erro ao verificar admin:', error);
          setIsAdmin(false);
        } else if (data) {
          console.log('✅ Usuário é admin com role:', data.role);
          setIsAdmin(true);
          
          // Simular dados de saúde do sistema
          setSystemHealth({
            status: 'healthy',
            uptime: '99.9%',
            activeUsers: Math.floor(Math.random() * 50) + 10,
            responseTime: Math.floor(Math.random() * 50) + 100 + 'ms'
          });
        } else {
          console.log('❌ Usuário não é admin');
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('❌ Erro na verificação:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header Premium */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-screen-2xl mx-auto">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Painel Administrativo
                  </h1>
                  <p className="text-xs text-muted-foreground">Sistema de Gestão Compuse</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status do Sistema */}
              <div className="hidden md:flex items-center space-x-2">
                <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(systemHealth.status)}`}>
                  {getStatusIcon(systemHealth.status)}
                  Sistema {systemHealth.status === 'healthy' ? 'Saudável' : 'Em Alerta'}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {systemHealth.activeUsers} usuários ativos
                  </div>
                </div>
              </div>
              
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Uptime: {systemHealth.uptime}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="container max-w-screen-2xl mx-auto p-6">
        <div className="space-y-6">
          {/* Métricas Rápidas */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Resposta Média</p>
                    <p className="text-2xl font-bold text-blue-900">{systemHealth.responseTime}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Uptime</p>
                    <p className="text-2xl font-bold text-green-900">{systemHealth.uptime}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Usuários Online</p>
                    <p className="text-2xl font-bold text-purple-900">{systemHealth.activeUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Status</p>
                    <p className="text-xl font-bold text-orange-900">Operacional</p>
                  </div>
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Painel de Navegação */}
          <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardContent className="p-0">
              <Tabs defaultValue="overview" className="w-full">
                <div className="border-b">
                  <TabsList className="grid w-full grid-cols-6 bg-transparent">
                    <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
                      <BarChart3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Visão Geral</span>
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Usuários</span>
                    </TabsTrigger>
                    <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Conteúdo</span>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
                      <BarChart3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Analytics</span>
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
                      <ScrollText className="h-4 w-4" />
                      <span className="hidden sm:inline">Logs</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Configurações</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="overview" className="mt-0">
                    <AdminOverview />
                  </TabsContent>

                  <TabsContent value="users" className="mt-0">
                    <AdminUsers />
                  </TabsContent>

                  <TabsContent value="content" className="mt-0">
                    <AdminContent />
                  </TabsContent>

                  <TabsContent value="analytics" className="mt-0">
                    <AdminAnalytics />
                  </TabsContent>

                  <TabsContent value="logs" className="mt-0">
                    <AdminLogs />
                  </TabsContent>

                  <TabsContent value="settings" className="mt-0">
                    <AdminSettings />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;