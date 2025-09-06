import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImpersonateButton } from '@/components/ui/impersonate-button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserDetailsModal } from './UserDetailsModal';
import { Search, Edit, Trash2, AlertTriangle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ModeratorUsersModalProps {
  moderator: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ModeratorUsersModal: React.FC<ModeratorUsersModalProps> = ({
  moderator,
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const { toast } = useToast();

  // Buscar usuários gerenciados pelo moderador
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['moderator-users', moderator?.user_id],
    queryFn: async () => {
      if (!moderator?.user_id) return [];

      // Buscar IDs dos usuários gerenciados pelo moderador
      const { data: moderatorUsers, error: moderatorError } = await supabase
        .from('moderator_users')
        .select('user_id')
        .eq('moderator_id', moderator.user_id);

      if (moderatorError) throw moderatorError;
      if (!moderatorUsers || moderatorUsers.length === 0) return [];

      const userIds = moderatorUsers.map(mu => mu.user_id);

      // Buscar perfis dos usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
        .not('name', 'like', '%[USUÁRIO EXCLUÍDO]%')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      return profiles || [];
    },
    enabled: isOpen && !!moderator?.user_id,
  });

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      // Marcar usuário como excluído
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
            original_name: userName,
            moderator_id: moderator.user_id
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários gerenciados por {moderator?.profile?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Barra de busca */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="secondary">
                {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Lista de usuários */}
            {isLoading ? (
              <div className="text-muted-foreground text-center py-8">
                Carregando usuários...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Este moderador ainda não gerencia nenhum usuário'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Foto</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Nome Artístico</TableHead>
                      <TableHead>Créditos</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar_url} alt={user.name} />
                            <AvatarFallback>{user.name?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>{user.artistic_name || '-'}</TableCell>
                        <TableCell>{user.credits || 0}</TableCell>
                        <TableCell>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <UserDetailsModal
        user={selectedUser}
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
        onUserUpdate={refetch}
      />
    </>
  );
};