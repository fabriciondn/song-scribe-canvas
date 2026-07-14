
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

      const originLabel = user.origin === 'moderator' ? 'Parceiro' : 
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
    <div className="space-y-4">
      {/* Header — premium */}
      <div className="relative rounded-2xl overflow-hidden p-4 bg-white/[0.025]
                      shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_18px_36px_-25px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_55%)] pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Gestão</span>
            </div>
            <h2 className="text-xl font-light tracking-tight text-white mt-1 flex items-center gap-2">
              <Users className="h-4 w-4 text-white/60" />
              Usuários
            </h2>
            <p className="text-[11px] text-white/40 mt-0.5">
              Visualize e gerencie todos os usuários da plataforma
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-3.5 w-3.5" />
              <Input
                placeholder="Buscar usuários…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/35 text-[12px]"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-[11px] text-white/70 transition-colors">
                  <Filter className="h-3.5 w-3.5" />
                  Filtros
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-[#141416] border-white/[0.08] text-white/80" align="end">
                <div className="space-y-4">
                  <h4 className="text-[11px] uppercase tracking-[0.14em] text-white/45">Filtros de pesquisa</h4>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-white/60">Data inicial</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                           className="bg-white/[0.03] border-white/[0.06] text-white text-[12px]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-white/60">Data final</label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                           className="bg-white/[0.03] border-white/[0.06] text-white text-[12px]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-white/60">Origem</label>
                    <Select value={originFilter} onValueChange={(value: any) => setOriginFilter(value)}>
                      <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white text-[12px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="affiliate">Afiliado</SelectItem>
                        <SelectItem value="moderator">Parceiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    className="w-full h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-[11px] text-white/70 transition-colors"
                    onClick={() => { setStartDate(''); setEndDate(''); setOriginFilter('all'); }}
                  >
                    Limpar filtros
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            <button
              onClick={handleExportToExcel}
              disabled={filteredUsers.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-emerald-400/10 hover:bg-emerald-400/15 ring-1 ring-emerald-400/20 text-[11px] text-emerald-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar
            </button>
          </div>
        </div>

        {/* Origin pill row */}
        <div className="relative mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <OriginPill
            active={originFilter === 'all'}
            label="Todos"
            count={users?.length || 0}
            dot="bg-white/60"
            icon={<Users className="h-3 w-3" />}
            onClick={() => { setOriginFilter('all'); setSpecificAffiliateId(''); setSpecificModeratorId(''); }}
          />
          <OriginPill
            active={originFilter === 'affiliate'}
            label="Afiliados"
            count={affiliateCount}
            dot="bg-emerald-400"
            icon={<Target className="h-3 w-3" />}
            onClick={() => { setOriginFilter('affiliate'); setSpecificModeratorId(''); }}
          />
          <OriginPill
            active={originFilter === 'moderator'}
            label="Parceiros"
            count={moderatorCount}
            dot="bg-sky-400"
            icon={<UserPlus className="h-3 w-3" />}
            onClick={() => { setOriginFilter('moderator'); setSpecificAffiliateId(''); }}
          />
          <OriginPill
            active={false}
            label="Diretos"
            count={directCount}
            dot="bg-white/40"
            icon={<Shield className="h-3 w-3" />}
          />
        </div>

        {/* Specific affiliate/moderator select */}
        {(originFilter === 'affiliate' || originFilter === 'moderator') && (
          <div className="relative mt-3">
            {originFilter === 'affiliate' && affiliatesList && affiliatesList.length > 0 && (
              <Select value={specificAffiliateId || 'all'} onValueChange={(value) => setSpecificAffiliateId(value === 'all' ? '' : value)}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white text-[12px] h-9 md:w-72">
                  <SelectValue placeholder="Filtrar por afiliado…" />
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
            )}
            {originFilter === 'moderator' && moderatorsList && moderatorsList.length > 0 && (
              <Select value={specificModeratorId || 'all'} onValueChange={(value) => setSpecificModeratorId(value === 'all' ? '' : value)}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white text-[12px] h-9 md:w-72">
                  <SelectValue placeholder="Filtrar por parceiro…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os parceiros</SelectItem>
                  {moderatorsList.map((mod: any) => (
                    <SelectItem key={mod.user_id} value={mod.user_id}>
                      {mod.profile?.name || mod.profile?.email || 'Parceiro'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      <AdvancedUserModal
        user={selectedUser}
        isOpen={isAdvancedModalOpen}
        onClose={() => { setIsAdvancedModalOpen(false); setSelectedUser(null); }}
        onUserUpdate={refetch}
      />

      {/* List — premium table */}
      <div className="relative rounded-2xl overflow-hidden bg-white/[0.025]
                      shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_18px_36px_-25px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_60%)] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Resultados</span>
              <span className="text-[11px] text-white/70 tabular-nums">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'usuário' : 'usuários'}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-7 w-7 border-t border-white/40" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
              <Users className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-[12px]">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow className="border-white/[0.05] hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-[0.14em] text-white/45 h-9">Usuário</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.14em] text-white/45 h-9">Email</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.14em] text-white/45 h-9">Status</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.14em] text-white/45 h-9">Atividade</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.14em] text-white/45 h-9">Créditos</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.14em] text-white/45 h-9 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: any) => {
                    const getSubscriptionStatus = () => {
                      const sub = user.subscription;
                      if (!sub) return { label: 'Gratuito', tone: 'neutral' as const, icon: null };
                      const now = new Date();
                      const expiresAt = sub.expires_at ? new Date(sub.expires_at) : null;
                      if (sub.status === 'active' && sub.plan_type === 'pro') {
                        return { label: 'Pro Ativo', tone: 'emerald' as const, icon: <Crown className="h-2.5 w-2.5" /> };
                      }
                      if (sub.status === 'trial') {
                        if (expiresAt && now <= expiresAt) {
                          const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          return { label: `Trial (${daysLeft}d)`, tone: 'amber' as const, icon: <Clock className="h-2.5 w-2.5" /> };
                        }
                        return { label: 'Trial Expirado', tone: 'red' as const, icon: <Clock className="h-2.5 w-2.5" /> };
                      }
                      if (sub.status === 'expired') {
                        if (sub.plan_type === 'trial') {
                          const daysSince = expiresAt ? Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                          return { label: `Expirou há ${daysSince}d`, tone: 'red' as const, icon: null };
                        }
                        return { label: 'Expirado', tone: 'red' as const, icon: null };
                      }
                      return { label: 'Gratuito', tone: 'neutral' as const, icon: null };
                    };

                    const getActivityStatus = () => {
                      if (!user.last_activity) return { label: 'Nunca', color: 'text-white/35' };
                      const now = new Date();
                      const lastActivity = new Date(user.last_activity);
                      const diffMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
                      const diffHours = Math.floor(diffMinutes / 60);
                      const diffDays = Math.floor(diffHours / 24);
                      if (diffMinutes < 5) return { label: 'Online', color: 'text-emerald-400' };
                      if (diffHours < 24) return { label: `${diffHours}h atrás`, color: 'text-amber-400' };
                      if (diffDays < 7) return { label: `${diffDays}d atrás`, color: 'text-orange-400' };
                      return { label: `${diffDays}d atrás`, color: 'text-red-400' };
                    };

                    const subscriptionStatus = getSubscriptionStatus();
                    const activityStatus = getActivityStatus();
                    const toneClass = {
                      emerald: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
                      amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
                      red: 'bg-red-400/10 text-red-300 ring-red-400/20',
                      neutral: 'bg-white/[0.05] text-white/60 ring-white/10',
                    }[subscriptionStatus.tone];

                    return (
                      <TableRow key={user.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-7 h-7 ring-1 ring-white/[0.06]">
                              <AvatarImage src={user.avatar_url} alt={user.name} />
                              <AvatarFallback className="bg-white/[0.04] text-white/60 text-[10px]">
                                {user.name?.[0] || user.email?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[12px] text-white truncate">{user.name || '-'}</span>
                                {user.hasIncompleteProfile && (
                                  <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20">
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                    Incompleto
                                  </span>
                                )}
                                {user.origin === 'affiliate' && (
                                  <span title="Origem: Afiliado">
                                    <Target className="h-3 w-3 text-emerald-400" />
                                  </span>
                                )}
                                {user.origin === 'moderator' && (
                                  <span title="Origem: Parceiro">
                                    <Shield className="h-3 w-3 text-sky-400" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-[11px] text-white/60 max-w-[220px] truncate">
                          {user.email || '-'}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full ring-1 ${toneClass}`}>
                            {subscriptionStatus.icon}
                            {subscriptionStatus.label}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-1.5">
                            <CircleDot className={`h-2.5 w-2.5 ${activityStatus.color}`} />
                            <span className="text-[11px] text-white/60">{activityStatus.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-[12px] text-white/75 tabular-nums">
                          {user.credits || 0}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-1.5 justify-center">
                            {!user.hasIncompleteProfile ? (
                              <ImpersonateButton
                                targetUser={{
                                  id: user.id,
                                  name: user.name,
                                  email: user.email,
                                  artistic_name: user.artistic_name,
                                }}
                                targetRole="user"
                                size="sm"
                                variant="outline"
                              />
                            ) : (
                              <Button variant="outline" size="sm" disabled title="Perfil incompleto">
                                <Users className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            <button
                              onClick={() => handleViewUser(user)}
                              disabled={user.hasIncompleteProfile}
                              title={user.hasIncompleteProfile ? 'Perfil incompleto' : 'Editar usuário'}
                              className="h-7 w-7 rounded-md flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="h-7 w-7 rounded-md flex items-center justify-center bg-white/[0.03] hover:bg-red-400/10 text-white/60 hover:text-red-300 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#141416] border-white/[0.08]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2 text-white">
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                    Excluir usuário
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-white/60">
                                    Tem certeza que deseja excluir <strong className="text-white/90">{user.name || user.email}</strong>?
                                    Esta ação marcará o usuário como excluído e ele não aparecerá mais na lista.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    className="bg-red-500/90 text-white hover:bg-red-500"
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
    </div>
  );
};

/* ---------- presentation primitives ---------- */

const OriginPill: React.FC<{
  active: boolean;
  label: string;
  count: number;
  dot: string;
  icon: React.ReactNode;
  onClick?: () => void;
}> = ({ active, label, count, dot, icon, onClick }) => {
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`group relative text-left rounded-xl overflow-hidden p-2.5
                  bg-white/[0.025] hover:bg-white/[0.045]
                  shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]
                  transition-all duration-200
                  ${active ? 'ring-1 ring-white/15 bg-white/[0.055]' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[13px] font-light text-white tabular-nums">{count}</span>
          <span className="h-5 w-5 rounded-full flex items-center justify-center bg-white/[0.04] text-white/55">
            {icon}
          </span>
        </div>
      </div>
    </Tag>
  );
};

