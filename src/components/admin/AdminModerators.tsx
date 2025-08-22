import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateModeratorModal } from './CreateModeratorModal';
import { UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';


export const AdminModerators = () => {
  const [isCreateModeratorModalOpen, setIsCreateModeratorModalOpen] = useState(false);

  // Buscar todos os moderadores e seus perfis
  const { data: moderators, isLoading } = useQuery({
    queryKey: ['moderators-list'],
    queryFn: async () => {
      const { data: mods, error } = await supabase
        .from('admin_users')
        .select('user_id, role, created_at')
        .in('role', ['moderator']);
      if (error) throw error;
      if (!mods) return [];
      const userIds = mods.map((m: any) => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', userIds);
      if (profileError) throw profileError;
      return mods.map((mod: any) => ({
        ...mod,
        profile: profiles?.find((p: any) => p.id === mod.user_id) || {},
      }));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Moderadores</h2>
          <p className="text-muted-foreground">
            Crie novos moderadores para a plataforma
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

      {/* Lista de moderadores */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Moderadores cadastrados</h3>
        {isLoading ? (
          <div className="text-muted-foreground">Carregando moderadores...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foto</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(moderators as any[])?.map((mod: any) => (
                <TableRow key={mod.user_id}>
                  <TableCell>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={mod.profile.avatar_url} alt={mod.profile.name} />
                      <AvatarFallback>{mod.profile.name?.[0] || 'M'}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>{mod.profile.name || '-'}</TableCell>
                  <TableCell>{mod.profile.email || '-'}</TableCell>
                  <TableCell>{mod.role}</TableCell>
                  <TableCell>{new Date(mod.created_at).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};