
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateModeratorModal } from './CreateModeratorModal';
import { EditModeratorModal } from './EditModeratorModal';
import { ModeratorUsersModal } from './ModeratorUsersModal';
import { UserPlus, Edit, Trash2, AlertTriangle, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImpersonateButton } from '@/components/ui/impersonate-button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AdminModerators = () => {
  const [isCreateModeratorModalOpen, setIsCreateModeratorModalOpen] = useState(false);
  const [editingModerator, setEditingModerator] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedModerator, setSelectedModerator] = useState<any>(null);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const { toast } = useToast();

  // Buscar todos os moderadores e seus perfis
  const { data: moderators, isLoading, refetch } = useQuery({
    queryKey: ['moderators-list'],
    queryFn: async () => {
      const { data: mods, error } = await supabase
        .from('admin_users')
        .select('user_id, role, created_at')
        .in('role', ['moderator']);
      if (error) throw error;
      if (!mods) return [];
      const userIds = mods.map((m: any) => m.user_id);
      if (userIds.length === 0) return [];
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, credits')
        .in('id', userIds)
        // Filtrar moderadores que não foram deletados (nome não contém "[USUÁRIO EXCLUÍDO]")
        .not('name', 'like', '%[USUÁRIO EXCLUÍDO]%');
      if (profileError) throw profileError;
      
      return mods
        .filter((mod: any) => profiles?.some((p: any) => p.id === mod.user_id))
        .map((mod: any) => ({
          ...mod,
          profile: profiles?.find((p: any) => p.id === mod.user_id) || {},
        }));
    },
  });

  const handleEditModerator = (moderator: any) => {
    setEditingModerator(moderator);
    setIsEditModalOpen(true);
  };

  const handleViewUsers = (moderator: any) => {
    setSelectedModerator(moderator);
    setIsUsersModalOpen(true);
  };

  const handleDeleteModerator = async (moderatorId: string) => {
    try {
      // Buscar perfil do moderador para log
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', moderatorId)
        .single();

      // Log da atividade antes de excluir
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: moderatorId,
          action: 'moderator_deleted_by_admin',
          metadata: {
            admin_user_id: (await supabase.auth.getUser()).data.user?.id,
            deleted_at: new Date().toISOString(),
            moderator_profile: profile
          }
        });

      // Marcar moderador como excluído alterando o nome no perfil
      await supabase
        .from('profiles')
        .update({ 
          name: `[USUÁRIO EXCLUÍDO] - ${profile?.name || 'Moderador'}`,
          email: `deleted_moderator_${moderatorId}@deleted.com`
        })
        .eq('id', moderatorId);

      // Remover da tabela admin_users
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('user_id', moderatorId)
        .eq('role', 'moderator');

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Moderador excluído com sucesso',
      });

      refetch();
    } catch (error: any) {
      console.error('Erro ao excluir moderador:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir moderador',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 px-1 md:px-0">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Moderadores</h2>
          <p className="text-muted-foreground">
            Crie, edite e gerencie moderadores da plataforma
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsCreateModeratorModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Criar Moderador
          </Button>
        </div>
      </div>

      <CreateModeratorModal
        isOpen={isCreateModeratorModalOpen}
        onClose={() => setIsCreateModeratorModalOpen(false)}
      />

      <EditModeratorModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingModerator(null);
        }}
        moderator={editingModerator}
        onModeratorUpdated={refetch}
      />

      <ModeratorUsersModal
        moderator={selectedModerator}
        isOpen={isUsersModalOpen}
        onClose={() => {
          setIsUsersModalOpen(false);
          setSelectedModerator(null);
        }}
      />

      {/* Lista de moderadores */}
      <div className="mt-4 md:mt-8">
        <h3 className="text-base md:text-lg font-semibold mb-2">Moderadores cadastrados</h3>
        {isLoading ? (
          <div className="text-muted-foreground">Carregando moderadores...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[350px] text-xs md:text-base">
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {(moderators as any[])?.map((mod: any) => (
                  <TableRow key={mod.user_id}>
                    <TableCell>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={mod.profile?.avatar_url} alt={mod.profile?.name} />
                        <AvatarFallback>{mod.profile?.name?.[0] || 'M'}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>{mod.profile?.name || '-'}</TableCell>
                    <TableCell>{mod.profile?.email || '-'}</TableCell>
                    <TableCell>{mod.profile?.credits || 0}</TableCell>
                    <TableCell>{new Date(mod.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUsers(mod)}
                          title="Ver usuários gerenciados"
                        >
                          <Users className="h-4 w-4" />
                        </Button>

                        <ImpersonateButton
                          targetUser={{
                            id: mod.user_id,
                            name: mod.profile?.name || 'Moderador',
                            email: mod.profile?.email || '',
                            artistic_name: null
                          }}
                          targetRole="moderator"
                          size="sm"
                          variant="outline"
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditModerator(mod)}
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
                                Excluir Moderador
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o moderador <strong>{mod.profile?.name || 'este moderador'}</strong>?
                                Esta ação não pode ser desfeita. Os usuários criados por este moderador 
                                permanecerão na plataforma.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteModerator(mod.user_id)}
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
    </div>
  );
};
