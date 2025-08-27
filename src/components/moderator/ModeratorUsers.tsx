
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
import { Plus, Edit, Trash2, Key, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getManagedUsers, createUserForModerator, updateManagedUserCredits } from '@/services/moderatorService';
import { supabase } from '@/integrations/supabase/client';

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
    },
    onError: (error: any) => {
      console.error('Erro ao criar usuário:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: { id: string; name: string; email: string; credits: number }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email,
          credits: userData.credits
        })
        .eq('id', userData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Usuário atualizado com sucesso');
      setIsEditModalOpen(false);
      setEditingUser(null);
      refetch();
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
      // Log da atividade antes de excluir
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          action: 'user_deleted_by_moderator',
          metadata: {
            moderator_user_id: (await supabase.auth.getUser()).data.user?.id,
            deleted_at: new Date().toISOString()
          }
        });

      // Remover da tabela moderator_users
      const { error: moderatorError } = await supabase
        .from('moderator_users')
        .delete()
        .eq('user_id', userId);

      if (moderatorError) throw moderatorError;

      // Remover da tabela auth.users via edge function seria o ideal
      // Por enquanto, vamos desativar o usuário atualizando o perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: `deleted_${Date.now()}@deleted.com`,
          name: '[USUÁRIO EXCLUÍDO]'
        })
        .eq('id', userId);

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      toast.success('Usuário excluído com sucesso');
      setSelectedUser(null);
      setDeleteConfirmText('');
      refetch();
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
          <CardTitle>Usuários Cadastrados</CardTitle>
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
                                  Excluir Usuário
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação é irreversível. Para confirmar, digite o nome completo do usuário: <strong>{user.name}</strong>
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
                                  disabled={deleteConfirmText !== user.name || deleteUserMutation.isPending}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteUserMutation.isPending ? 'Excluindo...' : 'Excluir'}
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
