
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Users, UserPlus, Edit, Trash2, AlertTriangle, Crown, Clock, CircleDot, Download, Filter, Target, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImpersonateButton } from '@/components/ui/impersonate-button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserDetailsModal } from './UserDetailsModal';
import { AdvancedUserModal } from './AdvancedUserModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as XLSX from 'xlsx';

export const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [originFilter, setOriginFilter] = useState<'all' | 'affiliate' | 'moderator'>('all');
  const [specificAffiliateId, setSpecificAffiliateId] = useState<string>('');
  const [specificModeratorId, setSpecificModeratorId] = useState<string>('');
  const { toast } = useToast();

  // Buscar todos os usuários com subscription e última atividade
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        // ETAPA 1: Buscar TODOS os user_ids de afiliados e moderadores PRIMEIRO
        const [allAffiliateDataResponse, allModeratorDataResponse] = await Promise.all([
          // Para afiliados: buscar profiles com código nas notas
          supabase
            .from('profiles')
            .select('id')
            .ilike('moderator_notes', '%Indicado por: compuse-%'),
          
          // Para moderadores: buscar da tabela moderator_users
          supabase
            .from('moderator_users')
            .select('user_id, moderator_id')
        ]);

        const affiliateData = allAffiliateDataResponse.data || [];
        const moderatorData = allModeratorDataResponse.data || [];

        console.log('🔥 ETAPA 1 - User IDs de origem:');
        console.log('  Affiliate profiles encontrados:', affiliateData.length);
        console.log('  Moderator user_ids encontrados:', moderatorData.length);

        // Criar Sets com TODOS os user_ids de afiliados e moderadores
        // Para afiliados, o id do profile JÁ É o user_id
        const allAffiliateUserIds = new Set(affiliateData.map((a: any) => a.id));
        const allModeratorUserIds = new Set(moderatorData.map((m: any) => m.user_id));

        console.log('  Affiliate unique user_ids:', allAffiliateUserIds.size);
        console.log('  Moderator unique user_ids:', allModeratorUserIds.size);

        // ETAPA 2: Buscar profiles existentes
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .not('name', 'like', '%[USUÁRIO EXCLUÍDO]%')
          .order('created_at', { ascending: false });
        
        if (profilesError) {
          console.error('❌ Erro ao buscar profiles:', profilesError);
          throw profilesError;
        }

        console.log('🔥 ETAPA 2 - Profiles encontrados:', profiles?.length || 0);

        // ETAPA 3: Identificar user_ids que existem em origem mas NÃO têm profile
        const profileIds = new Set(profiles?.map(p => p.id) || []);
        const missingAffiliateProfiles = Array.from(allAffiliateUserIds).filter(id => !profileIds.has(id));
        const missingModeratorProfiles = Array.from(allModeratorUserIds).filter(id => !profileIds.has(id));

        console.log('🔥 ETAPA 3 - Profiles faltantes:');
        console.log('  Affiliate users sem profile:', missingAffiliateProfiles.length);
        console.log('  Moderator users sem profile:', missingModeratorProfiles.length);

        // Buscar subscriptions e última atividade para TODOS os user_ids (incluindo os sem profile)
        const allUserIds = Array.from(new Set([
          ...profileIds,
          ...allAffiliateUserIds,
          ...allModeratorUserIds
        ]));

        console.log('🔥 ETAPA 4 - Buscando dados adicionais para:', allUserIds.length, 'usuários');

        const [subscriptionsData, sessionsData] = await Promise.all([
          supabase
            .from('subscriptions')
            .select('*')
            .in('user_id', allUserIds),
          
          supabase
            .from('user_sessions')
            .select('user_id, last_activity')
            .in('user_id', allUserIds)
        ]);

        // Mapear subscriptions e sessões
        const subscriptionsMap = new Map();
        subscriptionsData.data?.forEach((sub: any) => {
          if (!subscriptionsMap.has(sub.user_id)) {
            subscriptionsMap.set(sub.user_id, sub);
          }
        });

        const sessionsMap = new Map();
        sessionsData.data?.forEach((session: any) => {
          if (!sessionsMap.has(session.user_id)) {
            sessionsMap.set(session.user_id, session.last_activity);
          }
        });

        // Mapear origem dos usuários
        // Para afiliados: apenas marcar que vieram de afiliado (já temos o Set)
        // Para moderadores: guardar o moderator_id para referência
        const moderatorMap = new Map();
        moderatorData.forEach((m: any) => {
          if (!moderatorMap.has(m.user_id)) {
            moderatorMap.set(m.user_id, m.moderator_id);
          }
        });

        console.log('🔥 ETAPA 5 - Maps criados:');
        console.log('  Affiliate users (Set):', allAffiliateUserIds.size);
        console.log('  Moderator map size:', moderatorMap.size);

        // ETAPA 6: Criar registros para usuários SEM profile
        const usersWithoutProfile: any[] = [];

        // Adicionar usuários de afiliados sem profile
        missingAffiliateProfiles.forEach(userId => {
          usersWithoutProfile.push({
            id: userId,
            name: '[Perfil Incompleto]',
            email: '[Sem email]',
            created_at: new Date().toISOString(),
            credits: 0,
            subscription: subscriptionsMap.get(userId),
            last_activity: sessionsMap.get(userId),
            origin: 'affiliate',
            affiliate_id: undefined,
            moderator_id: undefined,
            hasIncompleteProfile: true
          });
        });

        // Adicionar usuários de moderadores sem profile
        missingModeratorProfiles.forEach(userId => {
          // Evitar duplicatas (um usuário pode estar em ambas as listas)
          if (!allAffiliateUserIds.has(userId)) {
            usersWithoutProfile.push({
              id: userId,
              name: '[Perfil Incompleto]',
              email: '[Sem email]',
              created_at: new Date().toISOString(),
              credits: 0,
              subscription: subscriptionsMap.get(userId),
              last_activity: sessionsMap.get(userId),
              origin: 'moderator',
              affiliate_id: undefined,
              moderator_id: moderatorMap.get(userId),
              hasIncompleteProfile: true
            });
          }
        });

        console.log('🔥 ETAPA 6 - Usuários sem profile criados:', usersWithoutProfile.length);

        // ETAPA 7: Combinar profiles existentes com usuários sem profile
        const enrichedProfiles = profiles?.map(profile => {
          const moderatorId = moderatorMap.get(profile.id);
          const isAffiliate = allAffiliateUserIds.has(profile.id);
          
          return {
            ...profile,
            subscription: subscriptionsMap.get(profile.id),
            last_activity: sessionsMap.get(profile.id),
            origin: moderatorId ? 'moderator' : isAffiliate ? 'affiliate' : 'direct',
            affiliate_id: undefined,
            moderator_id: moderatorId,
            hasIncompleteProfile: false
          };
        }) || [];

        // Combinar todos os usuários
        const allEnrichedUsers = [...enrichedProfiles, ...usersWithoutProfile];

        // ETAPA 8: Verificar contagem final
        const finalAffiliateCount = allEnrichedUsers.filter(u => u.origin === 'affiliate').length;
        const finalModeratorCount = allEnrichedUsers.filter(u => u.origin === 'moderator').length;
        const finalDirectCount = allEnrichedUsers.filter(u => u.origin === 'direct').length;

        console.log('✅ ETAPA 8 - Resultado FINAL:');
        console.log('  Total de usuários:', allEnrichedUsers.length);
        console.log('  Usuários de Afiliados:', finalAffiliateCount);
        console.log('  Usuários de Moderadores:', finalModeratorCount);
        console.log('  Usuários Diretos:', finalDirectCount);
        console.log('  Usuários com profile incompleto:', usersWithoutProfile.length);

        return allEnrichedUsers;
      } catch (error) {
        console.error('❌ ERRO FATAL na query:', error);
        throw error;
      }
    },
  });

  // Buscar lista de afiliados com perfis
  const { data: affiliatesList } = useQuery({
    queryKey: ['affiliates-list'],
    queryFn: async () => {
      const { data: affiliatesData, error: affError } = await supabase
        .from('affiliates')
        .select('id, affiliate_code, user_id')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      
      if (affError) throw affError;
      if (!affiliatesData) return [];

      const userIds = affiliatesData.map(a => a.user_id);
      const { data: profilesData, error: profError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profError) throw profError;

      return affiliatesData.map(aff => ({
        ...aff,
        profile: profilesData?.find(p => p.id === aff.user_id)
      }));
    },
  });

  // Buscar lista de moderadores com perfis
  const { data: moderatorsList } = useQuery({
    queryKey: ['moderators-list'],
    queryFn: async () => {
      const { data: moderatorsData, error: modError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('role', 'moderator')
        .order('created_at', { ascending: false });
      
      if (modError) throw modError;
      if (!moderatorsData) return [];

      const userIds = moderatorsData.map(m => m.user_id);
      const { data: profilesData, error: profError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profError) throw profError;

      return moderatorsData.map(mod => ({
        user_id: mod.user_id,
        profile: profilesData?.find(p => p.id === mod.user_id)
      }));
    },
  });

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setIsAdvancedModalOpen(true);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      // Marcar usuário como excluído alterando o nome
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: `[USUÁRIO EXCLUÍDO] - ${userName || 'Sem nome'}`,
          email: `deleted_user_${userId}@deleted.com`
        })
        .eq('id', userId);

      if (error) throw error;

      // Log da atividade
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          action: 'user_deleted_by_admin',
          metadata: {
            admin_user_id: (await supabase.auth.getUser()).data.user?.id,
            deleted_at: new Date().toISOString(),
            original_name: userName
          }
        });

      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso',
      });

      refetch();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir usuário',
        variant: 'destructive',
      });
    }
  };

  // Filtrar usuários baseado nos filtros aplicados
  const filteredUsers = users?.filter(user => {
    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.artistic_name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Filtro de data
    if (startDate) {
      const userDate = new Date(user.created_at);
      const filterStartDate = new Date(startDate);
      if (userDate < filterStartDate) return false;
    }
    
    if (endDate) {
      const userDate = new Date(user.created_at);
      const filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999); // Final do dia
      if (userDate > filterEndDate) return false;
    }

    // Filtro de origem
    if (originFilter !== 'all') {
      if (originFilter === 'affiliate' && user.origin !== 'affiliate') return false;
      if (originFilter === 'moderator' && user.origin !== 'moderator') return false;
    }

    // Filtro específico de afiliado
    if (specificAffiliateId && user.affiliate_id !== specificAffiliateId) {
      return false;
    }

    // Filtro específico de moderador
    if (specificModeratorId && user.moderator_id !== specificModeratorId) {
      return false;
    }

    return true;
  }) || [];

  // Contadores para os botões
  const affiliateCount = users?.filter(u => u.origin === 'affiliate').length || 0;
  const moderatorCount = users?.filter(u => u.origin === 'moderator').length || 0;
  const directCount = users?.filter(u => u.origin === 'direct').length || 0;

  // Função para exportar usuários para Excel
  const handleExportToExcel = () => {
    if (filteredUsers.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Nenhum usuário para exportar',
        variant: 'default',
      });
      return;
    }

    // Preparar dados para exportação
    const exportData = filteredUsers.map(user => {
      const subscriptionStatus = (() => {
        const sub = user.subscription;
        if (!sub) return 'Gratuito';
        
        const now = new Date();
        const expiresAt = sub.expires_at ? new Date(sub.expires_at) : null;
        
        if (sub.status === 'active' && sub.plan_type === 'pro') return 'Pro Ativo';
        if (sub.status === 'trial') {
          if (expiresAt && now <= expiresAt) {
            const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return `Trial (${daysLeft}d)`;
          }
          return 'Trial Expirado';
        }
        if (sub.status === 'expired') return 'Expirado';
        return 'Gratuito';
      })();

      const originLabel = user.origin === 'moderator' ? 'Moderador' : 
                         user.origin === 'affiliate' ? 'Afiliado' : 
                         'Cadastro Direto';

      return {
        'Nome': user.name || '-',
        'Nome Artístico': user.artistic_name || '-',
        'Email': user.email || '-',
        'CPF': user.cpf || '-',
        'Celular': user.cellphone || '-',
        'Status': subscriptionStatus,
        'Créditos': user.credits || 0,
        'Origem': originLabel,
        'Data de Cadastro': user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-',
        'CEP': user.cep || '-',
        'Cidade': user.city || '-',
        'Estado': user.state || '-',
      };
    });

    // Criar planilha Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuários');

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 30 }, // Nome
      { wch: 30 }, // Nome Artístico
      { wch: 35 }, // Email
      { wch: 15 }, // CPF
      { wch: 15 }, // Celular
      { wch: 15 }, // Status
      { wch: 10 }, // Créditos
      { wch: 15 }, // Origem
      { wch: 15 }, // Data de Cadastro
      { wch: 12 }, // CEP
      { wch: 20 }, // Cidade
      { wch: 10 }, // Estado
    ];
    ws['!cols'] = colWidths;

    // Gerar arquivo e fazer download
    const fileName = `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: 'Sucesso',
      description: `${filteredUsers.length} usuário(s) exportado(s) com sucesso`,
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 px-1 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestão de Usuários
          </h2>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os usuários da plataforma
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={originFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setOriginFilter('all');
                setSpecificAffiliateId('');
                setSpecificModeratorId('');
              }}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Todos ({(users?.length || 0)})
            </Button>
            <Button 
              variant={originFilter === 'affiliate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setOriginFilter('affiliate');
                setSpecificModeratorId('');
              }}
              className="gap-2"
            >
              <Target className="h-4 w-4" />
              Afiliados ({affiliateCount})
            </Button>
            <Button 
              variant={originFilter === 'moderator' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setOriginFilter('moderator');
                setSpecificAffiliateId('');
              }}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Moderadores ({moderatorCount})
            </Button>
          </div>
          
          {/* Filtro específico de afiliado */}
          {originFilter === 'affiliate' && affiliatesList && affiliatesList.length > 0 && (
            <div className="w-full md:w-60">
              <Select value={specificAffiliateId || 'all'} onValueChange={(value) => setSpecificAffiliateId(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por afiliado..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os afiliados</SelectItem>
                  {affiliatesList.map((aff: any) => (
                    <SelectItem key={aff.id} value={aff.id}>
                      {aff.profile?.name || aff.profile?.email || aff.affiliate_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Filtro específico de moderador */}
          {originFilter === 'moderator' && moderatorsList && moderatorsList.length > 0 && (
            <div className="w-full md:w-60">
              <Select value={specificModeratorId || 'all'} onValueChange={(value) => setSpecificModeratorId(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por moderador..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os moderadores</SelectItem>
                  {moderatorsList.map((mod: any) => (
                    <SelectItem key={mod.user_id} value={mod.user_id}>
                      {mod.profile?.name || mod.profile?.email || 'Moderador'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Mais Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Filtros de Pesquisa</h4>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Inicial</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Data inicial"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Final</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Data final"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Origem do Cadastro</label>
                  <Select value={originFilter} onValueChange={(value: any) => setOriginFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="affiliate">Afiliado</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setOriginFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            onClick={handleExportToExcel}
            className="gap-2"
            disabled={filteredUsers.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <AdvancedUserModal
        user={selectedUser}
        isOpen={isAdvancedModalOpen}
        onClose={() => {
          setIsAdvancedModalOpen(false);
          setSelectedUser(null);
        }}
        onUserUpdate={refetch}
      />

      {/* Lista de usuários */}
      <div className="mt-4 md:mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="secondary">
            {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Carregando usuários...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[350px] text-xs md:text-base">
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Atividade</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any) => {
                  const getSubscriptionStatus = () => {
                    const sub = user.subscription;
                    if (!sub) return { label: 'Gratuito', variant: 'outline' as const, icon: null };
                    
                    const now = new Date();
                    const expiresAt = sub.expires_at ? new Date(sub.expires_at) : null;
                    
                    if (sub.status === 'active' && sub.plan_type === 'pro') {
                      return { label: 'Pro Ativo', variant: 'default' as const, icon: <Crown className="h-3 w-3" /> };
                    }
                    if (sub.status === 'trial') {
                      if (expiresAt && now <= expiresAt) {
                        const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return { label: `Trial (${daysLeft}d)`, variant: 'secondary' as const, icon: <Clock className="h-3 w-3" /> };
                      }
                      return { label: 'Trial Expirado', variant: 'destructive' as const, icon: <Clock className="h-3 w-3" /> };
                    }
                    if (sub.status === 'expired') {
                      if (sub.plan_type === 'trial') {
                        const daysSince = expiresAt ? Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                        return { label: `Expirou há ${daysSince}d`, variant: 'destructive' as const, icon: null };
                      }
                      return { label: 'Expirado', variant: 'destructive' as const, icon: null };
                    }
                    return { label: 'Gratuito', variant: 'outline' as const, icon: null };
                  };

                  const getActivityStatus = () => {
                    if (!user.last_activity) return { label: 'Nunca', variant: 'outline' as const, color: 'text-muted-foreground' };
                    
                    const now = new Date();
                    const lastActivity = new Date(user.last_activity);
                    const diffMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
                    const diffHours = Math.floor(diffMinutes / 60);
                    const diffDays = Math.floor(diffHours / 24);
                    
                    if (diffMinutes < 5) {
                      return { label: 'Online', variant: 'default' as const, color: 'text-green-500' };
                    } else if (diffHours < 24) {
                      return { label: `${diffHours}h atrás`, variant: 'secondary' as const, color: 'text-yellow-500' };
                    } else if (diffDays < 7) {
                      return { label: `${diffDays}d atrás`, variant: 'outline' as const, color: 'text-orange-500' };
                    } else {
                      return { label: `${diffDays}d atrás`, variant: 'outline' as const, color: 'text-red-500' };
                    }
                  };

                  const subscriptionStatus = getSubscriptionStatus();
                  const activityStatus = getActivityStatus();

                  return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                        <AvatarFallback>{user.name?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{user.name || '-'}</span>
                        {user.hasIncompleteProfile && (
                          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Perfil Incompleto
                          </Badge>
                        )}
                        {user.origin === 'affiliate' && (
                          <div 
                            className="flex items-center" 
                            title={`Afiliado: ${
                              affiliatesList?.find((a: any) => a.id === user.affiliate_id)?.profile?.name || 
                              affiliatesList?.find((a: any) => a.id === user.affiliate_id)?.affiliate_code || 
                              'Desconhecido'
                            }`}
                          >
                            <Target className="h-4 w-4 text-green-500" />
                          </div>
                        )}
                        {user.origin === 'moderator' && (
                          <div 
                            className="flex items-center" 
                            title={`Moderador: ${
                              moderatorsList?.find((m: any) => m.user_id === user.moderator_id)?.profile?.name || 
                              moderatorsList?.find((m: any) => m.user_id === user.moderator_id)?.profile?.email || 
                              'Desconhecido'
                            }`}
                          >
                            <Shield className="h-4 w-4 text-blue-500" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{user.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={subscriptionStatus.variant} className="gap-1">
                        {subscriptionStatus.icon}
                        {subscriptionStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CircleDot className={`h-3 w-3 ${activityStatus.color}`} />
                        <span className="text-xs">{activityStatus.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.credits || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-center">
                        {!user.hasIncompleteProfile ? (
                          <ImpersonateButton
                            targetUser={{
                              id: user.id,
                              name: user.name,
                              email: user.email,
                              artistic_name: user.artistic_name
                            }}
                            targetRole="user"
                            size="sm"
                            variant="outline"
                          />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            title="Usuário com perfil incompleto não pode ser impersonado"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                          disabled={user.hasIncompleteProfile}
                          title={user.hasIncompleteProfile ? 'Usuário com perfil incompleto não pode ser editado' : 'Editar usuário'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Excluir Usuário
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o usuário <strong>{user.name || user.email}</strong>?
                                Esta ação marcará o usuário como excluído e ele não aparecerá mais na lista de usuários.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};
