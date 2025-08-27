
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getAllUsers, updateUserCredits } from '@/services/adminService';
import { ImpersonateButton } from '@/components/ui/impersonate-button';
import { UserDetailsModal } from './UserDetailsModal';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Search, Coins, Eye } from 'lucide-react';
import { DataMask } from '@/components/ui/data-mask';

export const AdminUsers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<any>(null);
  const [newCredits, setNewCredits] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
    refetchInterval: 30000,
  });

  const updateCreditsMutation = useMutation({
    mutationFn: ({ userId, credits }: { userId: string; credits: number }) =>
      updateUserCredits(userId, credits),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Créditos atualizados com sucesso!',
      });
      
      // Invalidar múltiplas queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['online-users-count'] });
      
      // Também forçar atualização em outros componentes que podem usar créditos
      queryClient.refetchQueries({ queryKey: ['user-credits'] });
      
      // Disparar evento customizado para atualizar créditos em tempo real
      window.dispatchEvent(new CustomEvent('credits-updated', { 
        detail: { userId: selectedUser?.id, newCredits } 
      }));
      
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setNewCredits('');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar créditos',
        variant: 'destructive',
      });
    },
  });

  const filteredUsers = users?.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.artistic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEditCredits = (user: any) => {
    setSelectedUser(user);
    setNewCredits(user.credits.toString());
    setIsEditModalOpen(true);
  };

  const handleUpdateCredits = () => {
    if (selectedUser && newCredits) {
      const credits = parseInt(newCredits);
      if (isNaN(credits) || credits < 0) {
        toast({
          title: 'Erro',
          description: 'Por favor, insira um número válido de créditos',
          variant: 'destructive',
        });
        return;
      }

      updateCreditsMutation.mutate({
        userId: selectedUser.id,
        credits: credits,
      });
    }
  };

  const handleViewDetails = (user: any) => {
    setSelectedUserForDetails(user);
    setIsDetailsModalOpen(true);
  };

  const handleUserUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
  <div className="space-y-4 md:space-y-6 px-1 md:px-0">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os usuários da plataforma
          </CardDescription>
        </CardHeader>
    <CardContent className="overflow-x-auto">
          {/* Barra de Pesquisa */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar usuários por nome, email ou nome artístico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="rounded-md border min-w-[350px] text-xs md:text-base">
            {/* Mobile: cards empilhados, Desktop: tabela */}
            <div className="block md:hidden divide-y divide-border">
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum usuário encontrado com o termo pesquisado' : 'Nenhum usuário encontrado'}
                  </p>
                </div>
              )}
              {filteredUsers.map((user) => (
                <div key={user.id} className="py-3 px-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{user.name || 'Nome não informado'}</span>
                    <Badge variant="outline">{user.artistic_name || '-'}</Badge>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <span><b>E-mail:</b> <DataMask data={user.email} type="email" /></span>
                    <span><b>Créditos:</b> <span className="inline-flex items-center gap-1"><Coins className="h-4 w-4 text-yellow-600" />{user.credits}</span></span>
                    <span><b>Registro:</b> {new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(user)}>
                      <Eye className="h-4 w-4 mr-1" />Detalhes
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditCredits(user)}>
                      <Edit className="h-4 w-4 mr-1" />Editar Créditos
                    </Button>
                    <ImpersonateButton targetUser={user} targetRole="user" />
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <Table className="min-w-[350px] text-xs md:text-base">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome Artístico</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Data de Registro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name || 'Nome não informado'}
                      </TableCell>
                      <TableCell>
                        <DataMask data={user.email} type="email" />
                      </TableCell>
                      <TableCell>
                        {user.artistic_name ? (
                          <Badge variant="outline">{user.artistic_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-yellow-600" />
                          {user.credits}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 flex-wrap gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(user)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
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
                  ))}
                </TableBody>
              </Table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum usuário encontrado com o termo pesquisado' : 'Nenhum usuário encontrado'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição de Créditos */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Créditos do Usuário</DialogTitle>
            <DialogDescription>
              Altere a quantidade de créditos para {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="credits">Quantidade de Créditos</Label>
              <Input
                id="credits"
                type="number"
                min="0"
                value={newCredits}
                onChange={(e) => setNewCredits(e.target.value)}
                placeholder="Digite a quantidade de créditos"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateCredits}
              disabled={updateCreditsMutation.isPending}
            >
              {updateCreditsMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes do usuário */}
      <UserDetailsModal 
        user={selectedUserForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
};
