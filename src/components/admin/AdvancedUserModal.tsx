import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Music, FileText, FolderOpen, Calendar, CreditCard, Download, Coins, User, Activity, Award, Crown, Clock, CheckCircle, UserCog, Shield, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdvancedUserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void;
}

export const AdvancedUserModal: React.FC<AdvancedUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(user?.credits || 0);
  const [moderatorNotes, setModeratorNotes] = useState(user?.moderator_notes || '');
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setCredits(user.credits || 0);
      setModeratorNotes(user.moderator_notes || '');
    }
  }, [user]);

  // Buscar role do usuário
  const { data: userRole, refetch: refetchRole } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data?.role || 'user';
    },
    enabled: isOpen && !!user?.id,
  });

  // Buscar dados de afiliado do usuário
  const { data: affiliateData, refetch: refetchAffiliate } = useQuery({
    queryKey: ['user-affiliate', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: isOpen && !!user?.id,
  });

  useEffect(() => {
    if (userRole) {
      setSelectedRole(userRole);
    }
  }, [userRole]);

  // Buscar estatísticas do usuário
  const { data: userStats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [songs, drafts, registrations, folders, transactions, subscriptions, activityLogs] = await Promise.all([
        // Músicas
        supabase
          .from('songs')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .is('deleted_at', null),
        
        // Rascunhos
        supabase
          .from('drafts')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .is('deleted_at', null),
        
        // Registros de autor
        supabase
          .from('author_registrations')
          .select('id, title, status, created_at')
          .eq('user_id', user.id),
        
        // Pastas
        supabase
          .from('folders')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .is('deleted_at', null),
        
        // Transações de crédito
        supabase
          .from('credit_transactions')
          .select('id, credits_purchased, total_amount, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        
        // Subscriptions
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        
        // Logs de atividade
        supabase
          .from('user_activity_logs')
          .select('action, metadata, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      return {
        songs: songs.data || [],
        drafts: drafts.data || [],
        registrations: registrations.data || [],
        folders: folders.data || [],
        transactions: transactions.data || [],
        subscriptions: subscriptions.data || [],
        activityLogs: activityLogs.data || []
      };
    },
    enabled: isOpen && !!user?.id,
  });

  const handleUpdateCredits = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits })
        .eq('id', user.id);

      if (error) throw error;

      // Log da atividade
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'credits_updated_by_admin',
          metadata: {
            admin_user_id: (await supabase.auth.getUser()).data.user?.id,
            old_credits: user.credits,
            new_credits: credits
          }
        });

      toast({
        title: 'Sucesso',
        description: 'Créditos atualizados com sucesso',
      });

      onUserUpdate();
    } catch (error) {
      console.error('Erro ao atualizar créditos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar créditos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ moderator_notes: moderatorNotes })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Notas atualizadas com sucesso',
      });

      onUserUpdate();
    } catch (error) {
      console.error('Erro ao atualizar notas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar notas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      if (selectedRole === 'user') {
        // Remover da tabela admin_users se for usuário comum
        const { error } = await supabase
          .from('admin_users')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Inserir ou atualizar na tabela admin_users
        const { error } = await supabase
          .from('admin_users')
          .upsert({
            user_id: user.id,
            role: selectedRole,
            permissions: selectedRole === 'moderator' 
              ? ['manage_user_credits', 'create_users']
              : ['full_access']
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;

        // Se for moderador, dar 100 créditos iniciais
        if (selectedRole === 'moderator') {
          const { error: creditsError } = await supabase
            .from('profiles')
            .update({ credits: Math.max(user.credits || 0, 100) })
            .eq('id', user.id);

          if (creditsError) throw creditsError;
        }
      }

      // Log da atividade
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'role_updated_by_admin',
          metadata: {
            admin_user_id: (await supabase.auth.getUser()).data.user?.id,
            old_role: userRole,
            new_role: selectedRole
          }
        });

      toast({
        title: 'Sucesso',
        description: `Função atualizada para ${selectedRole === 'user' ? 'usuário comum' : selectedRole}`,
      });

      refetchRole();
      onUserUpdate();
    } catch (error) {
      console.error('Erro ao atualizar função:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar função do usuário',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCertificate = async (registrationId: string) => {
    try {
      // Aqui você implementaria a lógica para gerar/baixar o certificado
      toast({
        title: 'Certificado',
        description: 'Funcionalidade de download do certificado será implementada',
      });
    } catch (error) {
      console.error('Erro ao baixar certificado:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao baixar certificado',
        variant: 'destructive',
      });
    }
  };

  const handleActivatePro = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Verificar se já existe uma subscription ativa
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias

      if (existingSub) {
        // Atualizar subscription existente
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            plan_type: 'pro',
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', existingSub.id);

        if (error) throw error;
      } else {
        // Criar nova subscription
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            status: 'active',
            plan_type: 'pro',
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            currency: 'BRL',
            auto_renew: false
          });

        if (error) throw error;
      }

      // Log da atividade
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'pro_activated_by_admin',
          metadata: {
            admin_user_id: (await supabase.auth.getUser()).data.user?.id,
            activated_at: now.toISOString(),
            expires_at: expiresAt.toISOString()
          }
        });

      toast({
        title: 'Sucesso',
        description: 'Assinatura Pro ativada por 30 dias',
      });

      onUserUpdate();
    } catch (error) {
      console.error('Erro ao ativar Pro:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao ativar assinatura Pro',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMakeAffiliate = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Verificar se já é afiliado
      if (affiliateData) {
        toast({
          title: 'Aviso',
          description: 'Este usuário já é um afiliado',
          variant: 'default',
        });
        return;
      }

      // Gerar código de afiliado usando a função SQL
      const { data: codeData, error: codeError } = await supabase.rpc(
        'generate_affiliate_code',
        { 
          user_id: user.id,
          user_name: user.name || user.email.split('@')[0]
        }
      );

      if (codeError) throw codeError;

      const affiliateCode = codeData;

      // Obter dados do perfil para usar como dados do afiliado
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Criar registro de afiliado com status aprovado
      const { data: adminUser } = await supabase.auth.getUser();
      
      const { error: insertError } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          affiliate_code: affiliateCode,
          status: 'approved',
          level: 'bronze',
          full_name: profile?.name || user.name || '',
          contact_email: profile?.email || user.email || '',
          whatsapp: profile?.cellphone || '',
          approved_by: adminUser.user?.id,
          approved_at: new Date().toISOString(),
          social_media_link: '',
          youtube_link: '',
          tiktok_link: '',
          website_link: '',
          promotion_strategy: 'Afiliado criado pelo administrador'
        });

      if (insertError) throw insertError;

      // Log da atividade
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'affiliate_created_by_admin',
          metadata: {
            admin_user_id: adminUser.user?.id,
            affiliate_code: affiliateCode,
            created_at: new Date().toISOString()
          }
        });

      toast({
        title: 'Sucesso',
        description: `Usuário transformado em afiliado com código: ${affiliateCode}`,
      });

      refetchAffiliate();
      onUserUpdate();
    } catch (error: any) {
      console.error('Erro ao tornar usuário em afiliado:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao tornar usuário em afiliado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAffiliateStatus = async (status: string) => {
    if (!affiliateData?.id) return;

    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: status as 'approved' | 'pending' | 'rejected' | 'suspended' })
        .eq('id', affiliateData.id);
      
      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Status do afiliado atualizado',
      });
      
      refetchAffiliate();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAffiliateLevel = async (level: string) => {
    if (!affiliateData?.id) return;

    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ 
          level: level as 'bronze' | 'silver' | 'gold',
          updated_at: new Date().toISOString()
        })
        .eq('id', affiliateData.id);
      
      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: `Nível do afiliado atualizado para ${level}`,
      });
      
      // Log da atividade
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'affiliate_level_updated',
          metadata: {
            admin_user_id: (await supabase.auth.getUser()).data.user?.id,
            affiliate_id: affiliateData.id,
            old_level: affiliateData.level,
            new_level: level
          }
        });
      
      refetchAffiliate();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateCommissionRate = async (newRate: number | null) => {
    if (!affiliateData?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ 
          custom_commission_rate: newRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', affiliateData.id);

      if (error) throw error;

      toast({
        title: "Comissão atualizada",
        description: newRate 
          ? `Taxa de comissão personalizada definida para ${newRate}%`
          : "Taxa de comissão resetada para padrão do nível",
      });

      // Log da atividade
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'affiliate_commission_updated',
          metadata: {
            admin_user_id: (await supabase.auth.getUser()).data.user?.id,
            affiliate_id: affiliateData.id,
            old_rate: affiliateData.custom_commission_rate,
            new_rate: newRate
          }
        });
      
      refetchAffiliate();
    } catch (error: any) {
      console.error('Erro ao atualizar comissão:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar taxa de comissão",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const stats = userStats;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar_url} alt={user.name} />
              <AvatarFallback>{user.name?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{user.name || 'Sem nome'}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="subscription">Assinatura</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
            <TabsTrigger value="management">Gerenciar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Músicas</CardTitle>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.songs?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.drafts?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Registros</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.registrations?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Créditos</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.credits || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Informações do perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome Artístico</Label>
                  <p className="text-sm">{user.artistic_name || 'Não informado'}</p>
                </div>
                <div>
                  <Label>CPF</Label>
                  <p className="text-sm">{user.cpf || 'Não informado'}</p>
                </div>
                <div>
                  <Label>Telefone</Label>
                  <p className="text-sm">{user.cellphone || 'Não informado'}</p>
                </div>
                <div>
                  <Label>Data de Nascimento</Label>
                  <p className="text-sm">
                    {user.birth_date ? new Date(user.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}
                  </p>
                </div>
                {(user.street || user.city || user.state) && (
                  <div className="col-span-2">
                    <Label>Endereço Completo</Label>
                    <p className="text-sm">
                      {[user.street, user.number, user.neighborhood, user.city, user.state, user.cep]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card de Status de Afiliado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Status de Afiliado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {affiliateData ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={
                        affiliateData.status === 'approved' ? 'default' :
                        affiliateData.status === 'pending' ? 'secondary' :
                        'destructive'
                      }>
                        {affiliateData.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {affiliateData.status === 'approved' ? 'Aprovado' :
                         affiliateData.status === 'pending' ? 'Pendente' :
                         affiliateData.status === 'rejected' ? 'Rejeitado' : 'Suspenso'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Nível:</span>
                      <Badge variant="outline">
                        {affiliateData.level === 'bronze' && '🥉 Bronze'}
                        {affiliateData.level === 'silver' && '🥈 Silver'}
                        {affiliateData.level === 'gold' && '🥇 Gold'}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Código:</span>
                      <code className="text-xs bg-muted p-2 rounded break-all">
                        {affiliateData.affiliate_code}
                      </code>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Comissão:</span>
                      <Badge variant="secondary" className="w-fit">
                        {affiliateData.custom_commission_rate 
                          ? `${affiliateData.custom_commission_rate}% personalizada`
                          : `${affiliateData.level === 'bronze' ? '25' : '50'}% padrão`}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Por registro: R$ {(19.99 * (affiliateData.custom_commission_rate || (affiliateData.level === 'bronze' ? 25 : 50)) / 100).toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground">Registros</div>
                        <div className="text-lg font-bold">{affiliateData.total_registrations || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Ganhos</div>
                        <div className="text-lg font-bold">
                          R$ {(affiliateData.total_earnings || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Este usuário não é um afiliado.
                    </p>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={handleMakeAffiliate}
                      disabled={isLoading}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Tornar Afiliado
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            {/* Informações da Assinatura */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Status da Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats?.subscriptions && stats.subscriptions.length > 0 ? (
                  <>
                    {(() => {
                      const currentSub = stats.subscriptions[0];
                      const now = new Date();
                      const expiresAt = currentSub.expires_at ? new Date(currentSub.expires_at) : null;
                      const startedAt = currentSub.started_at ? new Date(currentSub.started_at) : null;
                      
                      let statusBadge = null;
                      let statusDetails = '';
                      
                      if (currentSub.status === 'active' && currentSub.plan_type === 'pro') {
                        statusBadge = <Badge variant="default" className="gap-1"><Crown className="h-3 w-3" />Pro Ativo</Badge>;
                        statusDetails = `Acesso completo a todas as funcionalidades Pro`;
                      } else if (currentSub.status === 'trial') {
                        if (expiresAt && now <= expiresAt) {
                          const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          statusBadge = <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Trial Ativo</Badge>;
                          statusDetails = `Restam ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} de teste`;
                        } else {
                          const daysSince = expiresAt ? Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                          statusBadge = <Badge variant="destructive" className="gap-1"><Clock className="h-3 w-3" />Trial Expirado</Badge>;
                          statusDetails = `Expirou há ${daysSince} dia${daysSince !== 1 ? 's' : ''}`;
                        }
                      } else if (currentSub.status === 'expired') {
                        const daysSince = expiresAt ? Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                        statusBadge = <Badge variant="destructive">Expirado</Badge>;
                        statusDetails = `Expirou há ${daysSince} dia${daysSince !== 1 ? 's' : ''}`;
                      } else {
                        statusBadge = <Badge variant="outline">Gratuito</Badge>;
                        statusDetails = 'Acesso limitado às funcionalidades gratuitas';
                      }
                      
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Status Atual</p>
                              <p className="text-xs text-muted-foreground">{statusDetails}</p>
                            </div>
                            {statusBadge}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                              <Label className="text-xs text-muted-foreground">Tipo de Plano</Label>
                              <p className="text-sm font-medium">{currentSub.plan_type || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Renovação Automática</Label>
                              <p className="text-sm font-medium">{currentSub.auto_renew ? 'Sim' : 'Não'}</p>
                            </div>
                            {startedAt && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Início</Label>
                                <p className="text-sm font-medium">{startedAt.toLocaleDateString('pt-BR')}</p>
                              </div>
                            )}
                            {expiresAt && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Expira em</Label>
                                <p className="text-sm font-medium">{expiresAt.toLocaleDateString('pt-BR')}</p>
                              </div>
                            )}
                            {currentSub.payment_provider && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Provedor de Pagamento</Label>
                                <p className="text-sm font-medium">{currentSub.payment_provider}</p>
                              </div>
                            )}
                          </div>

                          {currentSub.status !== 'active' && (
                            <div className="pt-4 border-t">
                              <Button 
                                onClick={handleActivatePro}
                                disabled={isLoading}
                                className="w-full gap-2"
                              >
                                <Crown className="h-4 w-4" />
                                Ativar Pro Manualmente (30 dias)
                              </Button>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {stats.subscriptions.length > 1 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Histórico de Assinaturas</p>
                        <div className="space-y-2">
                          {stats.subscriptions.slice(1).map((sub: any, idx: number) => (
                            <div key={sub.id} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div>
                                <span className="font-medium">{sub.plan_type}</span>
                                <span className="text-muted-foreground ml-2">
                                  ({sub.started_at ? new Date(sub.started_at).toLocaleDateString('pt-BR') : 'N/A'})
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">{sub.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Nenhuma assinatura encontrada</p>
                    <Button 
                      onClick={handleActivatePro}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <Crown className="h-4 w-4" />
                      Ativar Pro Manualmente (30 dias)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Histórico de Transações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.transactions && stats.transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Créditos</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.transactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.credits_purchased}</TableCell>
                          <TableCell>R$ {transaction.total_amount}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma transação encontrada
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {/* Obras registradas */}
            {stats?.registrations && stats.registrations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Obras Registradas ({stats.registrations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.registrations.map((registration: any) => (
                        <TableRow key={registration.id}>
                          <TableCell>{registration.title}</TableCell>
                          <TableCell>
                            <Badge variant={registration.status === 'completed' ? 'default' : 'secondary'}>
                              {registration.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(registration.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadCertificate(registration.id)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Certificado
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Músicas e rascunhos em uma tabela compacta */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {stats?.songs && stats.songs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      Músicas Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.songs.slice(0, 5).map((song: any) => (
                        <div key={song.id} className="flex justify-between items-center">
                          <span className="text-sm truncate">{song.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(song.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ))}
                      {stats.songs.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          E mais {stats.songs.length - 5} música{stats.songs.length - 5 !== 1 ? 's' : ''}...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats?.drafts && stats.drafts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Rascunhos Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.drafts.slice(0, 5).map((draft: any) => (
                        <div key={draft.id} className="flex justify-between items-center">
                          <span className="text-sm truncate">{draft.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(draft.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ))}
                      {stats.drafts.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          E mais {stats.drafts.length - 5} rascunho{stats.drafts.length - 5 !== 1 ? 's' : ''}...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Histórico de Atividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.activityLogs && stats.activityLogs.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {stats.activityLogs.map((log: any, idx: number) => {
                      const getActivityIcon = (action: string) => {
                        if (action.includes('login')) return <CheckCircle className="h-4 w-4 text-green-500" />;
                        if (action.includes('credit')) return <Coins className="h-4 w-4 text-yellow-500" />;
                        if (action.includes('pro')) return <Crown className="h-4 w-4 text-purple-500" />;
                        return <Activity className="h-4 w-4 text-blue-500" />;
                      };

                      const getActivityLabel = (action: string) => {
                        const labels: Record<string, string> = {
                          'user_login': 'Login realizado',
                          'credits_updated_by_admin': 'Créditos atualizados pelo admin',
                          'credits_updated_by_moderator': 'Créditos atualizados por moderador',
                          'pro_activated_by_admin': 'Pro ativado pelo admin',
                          'user_deleted_by_admin': 'Usuário excluído',
                          'song_created': 'Música criada',
                          'draft_created': 'Rascunho criado',
                          'registration_created': 'Registro criado'
                        };
                        return labels[action] || action;
                      };

                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          {getActivityIcon(log.action)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{getActivityLabel(log.action)}</p>
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <p className="text-xs text-muted-foreground truncate">
                                {JSON.stringify(log.metadata)}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(log.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma atividade registrada
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="space-y-4">
            {/* Seção de Afiliado */}
            {affiliateData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5" />
                    Gerenciar Afiliado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Status do Afiliado</Label>
                    <Select 
                      value={affiliateData.status} 
                      onValueChange={handleUpdateAffiliateStatus}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="suspended">Suspenso</SelectItem>
                        <SelectItem value="rejected">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nível do Afiliado</Label>
                    <Select 
                      value={affiliateData.level} 
                      onValueChange={handleUpdateAffiliateLevel}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">🥉 Bronze (25%)</SelectItem>
                        <SelectItem value="silver">🥈 Silver (50%)</SelectItem>
                        <SelectItem value="gold">🥇 Gold (50% + Recorrente)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Taxa de Comissão Personalizada</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder={`Padrão: ${affiliateData.level === 'bronze' ? '25' : '50'}%`}
                        value={affiliateData.custom_commission_rate || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            handleUpdateCommissionRate(null);
                          } else {
                            const rate = parseFloat(value);
                            if (rate >= 0 && rate <= 100) {
                              handleUpdateCommissionRate(rate);
                            }
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateCommissionRate(null)}
                        title="Resetar para padrão"
                        disabled={!affiliateData.custom_commission_rate}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {affiliateData.custom_commission_rate 
                        ? `Comissão atual: ${affiliateData.custom_commission_rate}% sobre cada registro (R$ ${(19.99 * affiliateData.custom_commission_rate / 100).toFixed(2)})`
                        : `Comissão padrão do nível ${affiliateData.level}: ${affiliateData.level === 'bronze' ? '25' : '50'}% (R$ ${(19.99 * (affiliateData.level === 'bronze' ? 25 : 50) / 100).toFixed(2)})`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gerenciar Função/Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Gerenciar Função do Usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="role">Função</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Usuário Comum
                          </div>
                        </SelectItem>
                        <SelectItem value="moderator">
                          <div className="flex items-center gap-2">
                            <UserCog className="h-4 w-4" />
                            Moderador
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Administrador
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectedRole === 'user' && 'Usuário comum sem privilégios administrativos'}
                      {selectedRole === 'moderator' && 'Pode gerenciar créditos e criar usuários (recebe 100 créditos ao se tornar moderador)'}
                      {selectedRole === 'admin' && 'Acesso completo ao sistema administrativo'}
                    </p>
                  </div>
                  <Button 
                    onClick={handleUpdateRole} 
                    disabled={isLoading || selectedRole === userRole}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Atualizar Função
                  </Button>
                </div>
                
                {userRole && userRole !== 'user' && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Função Atual</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
                        {userRole === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                        {userRole === 'moderator' && <UserCog className="h-3 w-3 mr-1" />}
                        {userRole}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gestão de créditos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Gerenciar Créditos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="credits">Créditos</Label>
                    <Input
                      id="credits"
                      type="number"
                      value={credits}
                      onChange={(e) => setCredits(Number(e.target.value))}
                      min="0"
                    />
                  </div>
                  <Button onClick={handleUpdateCredits} disabled={isLoading}>
                    Atualizar Créditos
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notas do moderador */}
            <Card>
              <CardHeader>
                <CardTitle>Notas do Administrador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  rows={4}
                  placeholder="Adicione notas sobre este usuário..."
                />
                <Button onClick={handleUpdateNotes} disabled={isLoading}>
                  Salvar Notas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};