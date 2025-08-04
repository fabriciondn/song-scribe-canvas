import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Search, Copy, RefreshCw, Eye, EyeOff, DollarSign, User, Receipt, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getManagedUsers, updateManagedUserCredits, createUserForModerator, registerUserCreatedByModerator } from '@/services/moderatorService';
import { useUserCredits } from '@/hooks/useUserCredits';
import { ImpersonateButton } from '@/components/ui/impersonate-button';
import { TransactionForm } from './TransactionForm';
import { UserTransactionsList } from './UserTransactionsList';
import { UserNotesModal } from './UserNotesModal';

export const ModeratorUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newCredits, setNewCredits] = useState<number>(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<{email: string, password: string} | null>(null);
  const [editingUserData, setEditingUserData] = useState<any>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    artistic_name: ''
  });
  const [selectedUserForTransaction, setSelectedUserForTransaction] = useState<any>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [transactionRefreshTrigger, setTransactionRefreshTrigger] = useState(0);
  const [selectedTransactionUser, setSelectedTransactionUser] = useState<any>(null);
  const [selectedNotesUser, setSelectedNotesUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    artistic_name: ''
  });

  // Função para gerar senha forte aleatória
  const generateStrongPassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Gerar senha automaticamente quando o diálogo abrir
  useEffect(() => {
    if (isCreateDialogOpen) {
      const autoPassword = generateStrongPassword();
      setNewUser(prev => ({ ...prev, password: autoPassword }));
    }
  }, [isCreateDialogOpen]);

  const { credits: moderatorCredits } = useUserCredits();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['managed-users'],
    queryFn: getManagedUsers,
  });

  const updateCreditsMutation = useMutation({
    mutationFn: ({ userId, credits }: { userId: string; credits: number }) =>
      updateManagedUserCredits(userId, credits),
    onSuccess: () => {
      toast.success('Créditos atualizados com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['managed-users'] });
      queryClient.invalidateQueries({ queryKey: ['moderator-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar créditos');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: createUserForModerator,
    onSuccess: (data) => {
      console.log('✅ Usuário criado com sucesso:', data);
      
      // Guardar credenciais para mostrar ao moderador
      setCreatedUserCredentials({
        email: newUser.email,
        password: newUser.password
      });
      
      toast.success('Usuário criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['managed-users'] });
      queryClient.invalidateQueries({ queryKey: ['moderator-dashboard-stats'] });
      setIsCreateDialogOpen(false);
      setIsCredentialsDialogOpen(true);
      setNewUser({ name: '', email: '', password: '', artistic_name: '' });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao criar usuário:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    },
  });

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.artistic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditCredits = (user: any) => {
    setEditingUser(user);
    setNewCredits(user.credits);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCredits = () => {
    if (editingUser) {
      updateCreditsMutation.mutate({
        userId: editingUser.id,
        credits: newCredits
      });
    }
  };

  const handleCreateUser = () => {
    createUserMutation.mutate(newUser);
  };

  const handleEditUserData = (user: any) => {
    setEditingUserData(user);
    setEditUserForm({
      name: user.name || '',
      email: user.email || '',
      artistic_name: user.artistic_name || ''
    });
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUserData = async () => {
    if (!editingUserData) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editUserForm.name,
          email: editUserForm.email,
          artistic_name: editUserForm.artistic_name || null
        })
        .eq('id', editingUserData.id);

      if (error) throw error;

      toast.success('Dados do usuário atualizados com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['managed-users'] });
      setIsEditUserDialogOpen(false);
      setEditingUserData(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar dados do usuário');
    }
  };

  const handleOpenTransactionDialog = (user: any) => {
    setSelectedUserForTransaction(user);
    setIsTransactionDialogOpen(true);
  };

  const handleTransactionCreated = () => {
    setTransactionRefreshTrigger(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usuários Gerenciados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">Carregando usuários...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Usuários Gerenciados</h2>
          <p className="text-muted-foreground">
            Gerencie os usuários que você criou e seus créditos
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Senha (Gerada Automaticamente)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Senha do usuário"
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNewUser({ ...newUser, password: generateStrongPassword() })}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Uma senha forte foi gerada automaticamente. Use os botões para visualizar ou gerar uma nova.
                </p>
              </div>
              <div>
                <Label htmlFor="artistic_name">Nome Artístico (Opcional)</Label>
                <Input
                  id="artistic_name"
                  value={newUser.artistic_name}
                  onChange={(e) => setNewUser({ ...newUser, artistic_name: e.target.value })}
                  placeholder="Nome artístico"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending || !newUser.name || !newUser.email || !newUser.password}
                >
                  {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Seus créditos disponíveis: <span className="font-semibold">{moderatorCredits || 0}</span>
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nome Artístico</TableHead>
                <TableHead>Créditos</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário gerenciado ainda'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name || 'Não informado'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.artistic_name ? (
                        <Badge variant="secondary">{user.artistic_name}</Badge>
                      ) : (
                        'Não informado'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.credits} créditos</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                     <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUserData(user)}
                          >
                            <User className="h-4 w-4 mr-1" />
                            Editar Cadastro
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedNotesUser(user)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Notas
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCredits(user)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Editar Créditos
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenTransactionDialog(user)}
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            Lançar Valor
                          </Button>
                          <ImpersonateButton 
                            targetUser={user} 
                            targetRole="user" 
                          />
                        </div>
                     </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Créditos</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label>Usuário</Label>
                <p className="text-sm text-muted-foreground">
                  {editingUser.name} ({editingUser.email})
                </p>
              </div>
              <div>
                <Label htmlFor="credits">Novos Créditos</Label>
                <Input
                  id="credits"
                  type="number"
                  min="0"
                  value={newCredits}
                  onChange={(e) => setNewCredits(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Créditos atuais: {editingUser.credits}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateCredits}
                  disabled={updateCreditsMutation.isPending}
                >
                  {updateCreditsMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar dados do usuário */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Dados do Usuário</DialogTitle>
          </DialogHeader>
          {editingUserData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input
                  id="edit-name"
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-artistic-name">Nome Artístico</Label>
                <Input
                  id="edit-artistic-name"
                  value={editUserForm.artistic_name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, artistic_name: e.target.value })}
                  placeholder="Nome artístico"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditUserDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateUserData}
                >
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para mostrar credenciais do usuário criado */}
      <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuário Criado com Sucesso!</DialogTitle>
          </DialogHeader>
          {createdUserCredentials && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                As credenciais do usuário foram geradas. Anote essas informações em local seguro:
              </p>
              
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Email:</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      value={createdUserCredentials.email}
                      readOnly
                      className="bg-background"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(createdUserCredentials.email);
                        toast.success('Email copiado!');
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Senha:</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      value={createdUserCredentials.password}
                      readOnly
                      className="bg-background font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(createdUserCredentials.password);
                        toast.success('Senha copiada!');
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Importante:</strong> Guarde essas credenciais em local seguro. 
                  Você pode agora usar o botão "Operar como" para acessar a conta deste usuário.
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => {
                  setIsCredentialsDialogOpen(false);
                  setCreatedUserCredentials(null);
                }}>
                  Entendido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para lançamento de valores */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Lançar Valores - {selectedUserForTransaction?.name}</DialogTitle>
          </DialogHeader>
          {selectedUserForTransaction && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TransactionForm
                userId={selectedUserForTransaction.id}
                userName={selectedUserForTransaction.name || selectedUserForTransaction.email}
                onTransactionCreated={handleTransactionCreated}
              />
              <UserTransactionsList
                userId={selectedUserForTransaction.id}
                userName={selectedUserForTransaction.name || selectedUserForTransaction.email}
                refreshTrigger={transactionRefreshTrigger}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Notas */}
      <UserNotesModal
        isOpen={!!selectedNotesUser}
        onClose={() => setSelectedNotesUser(null)}
        user={selectedNotesUser || { id: '', name: '', email: '' }}
      />
    </div>
  );
};