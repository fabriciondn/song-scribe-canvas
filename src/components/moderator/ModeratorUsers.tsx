import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getManagedUsers, updateManagedUserCredits, createUserForModerator, registerUserCreatedByModerator } from '@/services/moderatorService';
import { useUserCredits } from '@/hooks/useUserCredits';
import { ImpersonateButton } from '@/components/ui/impersonate-button';

export const ModeratorUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newCredits, setNewCredits] = useState<number>(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    artistic_name: ''
  });

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
    onSuccess: async (data) => {
      await registerUserCreatedByModerator(data.userId);
      toast.success('Usuário criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['managed-users'] });
      queryClient.invalidateQueries({ queryKey: ['moderator-dashboard-stats'] });
      setIsCreateDialogOpen(false);
      setNewUser({ name: '', email: '', password: '', artistic_name: '' });
    },
    onError: (error: any) => {
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
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Senha do usuário"
                />
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
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCredits(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar Créditos
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
    </div>
  );
};