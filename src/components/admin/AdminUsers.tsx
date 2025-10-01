
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Users, UserPlus, Edit, Trash2, AlertTriangle, Crown, Clock, CircleDot } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImpersonateButton } from '@/components/ui/impersonate-button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserDetailsModal } from './UserDetailsModal';
import { AdvancedUserModal } from './AdvancedUserModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const { toast } = useToast();

  // Buscar todos os usuários com subscription e última atividade
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .not('name', 'like', '%[USUÁRIO EXCLUÍDO]%')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      // Buscar subscriptions e última atividade para cada usuário
      const userIds = profiles?.map(p => p.id) || [];
      
      const [subscriptionsData, sessionsData] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('*')
          .in('user_id', userIds)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('user_sessions')
          .select('user_id, last_activity')
          .in('user_id', userIds)
          .order('last_activity', { ascending: false })
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

      // Combinar dados
      const enrichedUsers = profiles?.map(profile => ({
        ...profile,
        subscription: subscriptionsMap.get(profile.id),
        last_activity: sessionsMap.get(profile.id)
      })) || [];

      return enrichedUsers;
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

  // Filtrar usuários baseado no termo de busca
  const filteredUsers = users?.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.artistic_name?.toLowerCase().includes(searchLower)
    );
  }) || [];

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
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
                    <TableCell>{user.name || '-'}</TableCell>
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
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUser(user)}
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
