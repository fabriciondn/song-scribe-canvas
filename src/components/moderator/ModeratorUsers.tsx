import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Key, AlertTriangle, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getManagedUsers, createUserForModerator, updateManagedUserCredits } from '@/services/moderatorService';
import { supabase } from '@/integrations/supabase/client';
import { ImpersonateButton } from '@/components/ui/impersonate-button';

export const ModeratorUsers = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    artistic_name: ''
  });

  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    credits: 0
  });

  const [newPassword, setNewPassword] = useState('');

  const queryClient = useQueryClient();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['managed-users'],
    queryFn: getManagedUsers,
  });

  const createUserMutation = useMutation({
    mutationFn: createUserForModerator,
    onSuccess: () => {
      toast.success('Usuário criado com sucesso');
      setIsCreateModalOpen(false);
      setNewUserData({ name: '', email: '', password: '', artistic_name: '' });
      refetch();
      // Invalidar queries relacionadas para atualizar contadores
      queryClient.invalidateQueries({ queryKey: ['moderator-dashboard-stats'] });
    },
    onError: (error: any) => {
      console.error('Erro ao criar usuário:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: { id: string; name: string; email: string; credits: number }) => {
      console.log('🔧 Atualizando usuário:', userData);
      
      // Usar a função RPC para atualizar créditos que já desconta do moderador
      if (userData.credits !== editingUser.credits) {
        const creditDifference = userData.credits - editingUser.credits;
        
        // Usar moderator_update_user_credits que já verifica e desconta do moderador
        const { error: creditError } = await supabase.rpc('moderator_update_user_credits', {
          target_user_id: userData.id,
          new_credits: userData.credits
        });

        if (creditError) {
          console.error('❌ Erro na atualização de créditos:', creditError);
          throw creditError;
        }
      }

      // Atualizar nome e email
      const { error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email
        })
        .eq('id', userData.id);

      if (error) {
        console.error('❌ Erro na atualização do perfil:', error);
        throw error;
      }
      
      console.log('✅ Usuário atualizado com sucesso');
    },
    onSuccess: () => {
      toast.success('Usuário atualizado com sucesso');
      setIsEditModalOpen(false);
      setEditingUser(null);
      refetch();
      // Atualizar créditos do moderador no hook
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(error.message || 'Erro ao atualizar usuário');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (userData: { userId: string; newPassword: string }) => {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          user_id: userData.userId,
          new_password: userData.newPassword
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso');
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setSelectedUser(null);
    },
    onError: (error: any) => {
      console.error('Erro ao alterar senha:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('🗑️ Iniciando exclusão completa do usuário:', userId);
      
      // 1. Primeiro, buscar dados do usuário para logs
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name, email, credits')
        .eq('id', userId)
        .single();

      // 2. Log da atividade antes de excluir
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          action: 'user_deleted_by_moderator',
          metadata: {
            moderator_user_id: (await supabase.auth.getUser()).data.user?.id,
            deleted_at: new Date().toISOString(),
            user_profile: userProfile
          }
        });

      // 3. Excluir todas as tabelas relacionadas (em ordem de dependência)
      
      // Excluir registros de autor
      await supabase
        .from('author_registrations')
        .delete()
        .eq('user_id', userId);

      // Excluir rascunhos
      await supabase
        .from('drafts')
        .delete()
        .eq('user_id', userId);

      // Excluir músicas
      await supabase
        .from('songs')
        .delete()
        .eq('user_id', userId);

      // Excluir templates
      await supabase
        .from('templates')
        .delete()
        .eq('user_id', userId);

      // Excluir pastas
      await supabase
        .from('folders')
        .delete()
        .eq('user_id', userId);

      // Excluir bases musicais
      await supabase
        .from('music_bases')
        .delete()
        .eq('user_id', userId);

      // Excluir transações do moderador
      await supabase
        .from('moderator_transactions')
        .delete()
        .eq('user_id', userId);

      // Excluir sessões do usuário
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);

      // 4. Remover da tabela moderator_users
      const { error: moderatorError } = await supabase
        .from('moderator_users')
        .delete()
        .eq('user_id', userId);

      if (moderatorError) {
        console.error('❌ Erro ao remover de moderator_users:', moderatorError);
        throw moderatorError;
      }

      // 5. Excluir perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('❌ Erro ao excluir perfil:', profileError);
        throw profileError;
      }

      // 6. Tentar excluir do auth via edge function (opcional)
      try {
        await supabase.functions.invoke('delete-user', {
          body: { user_id: userId }
        });
        console.log('✅ Usuário excluído do auth também');
      } catch (error) {
        console.log('⚠️ Aviso: Não foi possível excluir do auth, mas perfil foi removido');
      }

      console.log('✅ Exclusão completa do usuário finalizada');
    },
    onSuccess: () => {
      toast.success('Usuário excluído completamente com sucesso');
      setSelectedUser(null);
      setDeleteConfirmText('');
      refetch();
      // Invalidar queries relacionadas para atualizar contadores
      queryClient.invalidateQueries({ queryKey: ['moderator-dashboard-stats'] });
    },
    onError: (error: any) => {
      console.error('Erro ao excluir usuário:', error);
      toast.error(error.message || 'Erro ao excluir usuário');
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createUserMutation.mutate(newUserData);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserData({
      name: user.name || '',
      email: user.email || '',
      credits: user.credits || 0
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    updateUserMutation.mutate({
      id: editingUser.id,
      ...editUserData
    });
  };

  const handleChangePassword = (user: any) => {
    setSelectedUser(user);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    
    changePasswordMutation.mutate({
      userId: selectedUser.id,
      newPassword: newPassword
    });
  };

  const handleDeleteUser = () => {
    if (!selectedUser || deleteConfirmText !== selectedUser.name) return;
    
    deleteUserMutation.mutate(selectedUser.id);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Usuários Gerenciados</h2>
          <p className="text-muted-foreground">
            Gerencie os usuários que você criou
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Senha do usuário"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="artistic_name">Nome Artístico</Label>
                <Input
                  id="artistic_name"
                  value={newUserData.artistic_name}
                  onChange={(e) => setNewUserData({ ...newUserData, artistic_name: e.target.value })}
                  placeholder="Nome artístico (opcional)"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando usuários...</div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome Artístico</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>{user.artistic_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.credits}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
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
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangePassword(user)}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-destructive" />
                                  Excluir Usuário Completamente
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  <div className="space-y-2">
                                    <p><strong>ATENÇÃO:</strong> Esta ação irá excluir PERMANENTEMENTE:</p>
                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                      <li>O perfil do usuário</li>
                                      <li>Todas as músicas criadas</li>
                                      <li>Todos os rascunhos</li>
                                      <li>Registros de autor</li>
                                      <li>Templates e pastas</li>
                                      <li>Histórico de transações</li>
                                    </ul>
                                    <p className="mt-4">Para confirmar, digite o nome completo do usuário: <strong>{selectedUser?.name}</strong></p>
                                  </div>
                                  <Input
                                    className="mt-2"
                                    placeholder="Digite o nome do usuário"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                  />
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => {
                                  setSelectedUser(null);
                                  setDeleteConfirmText('');
                                }}>
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteUser}
                                  disabled={deleteConfirmText !== selectedUser?.name || deleteUserMutation.isPending}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteUserMutation.isPending ? 'Excluindo...' : 'Excluir Permanentemente'}
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editUserData.name}
                onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                placeholder="Nome do usuário"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-credits">Créditos</Label>
              <Input
                id="edit-credits"
                type="number"
                min="0"
                value={editUserData.credits}
                onChange={(e) => setEditUserData({ ...editUserData, credits: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Atenção: Alteração de créditos será descontada/creditada dos seus créditos
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Trocar Senha */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trocar Senha do Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="flex gap-2">
                <Input
                  id="new-password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomPassword}
                >
                  Gerar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Clique em "Gerar" para criar uma senha aleatória segura
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
