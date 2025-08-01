import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminContent } from '@/components/admin/AdminContent';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { Shield, Users, FileText, BarChart3, Settings } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-6">
          <Shield className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Painel Administrativo</h1>
        </div>
      </div>

      <div className="flex-1 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Admin</h2>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <AdminContent />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;