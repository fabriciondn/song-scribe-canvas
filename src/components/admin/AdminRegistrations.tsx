import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Trash2, Music, RefreshCw, Eye, Download } from 'lucide-react';

interface Registration {
  id: string;
  title: string;
  author: string;
  other_authors: string | null;
  lyrics: string;
  genre: string;
  rhythm: string;
  song_version: string;
  audio_file_path: string | null;
  status: string;
  hash: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  additional_info: string | null;
  profile: {
    name: string | null;
    email: string | null;
    artistic_name: string | null;
  } | null;
}

export const AdminRegistrations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    other_authors: '',
    lyrics: '',
    genre: '',
    rhythm: '',
    song_version: '',
    additional_info: '',
    status: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar registros
  const { data: registrations, isLoading, refetch } = useQuery({
    queryKey: ['admin-registrations'],
    queryFn: async () => {
      // Primeiro buscar os registros
      const { data: regs, error: regsError } = await supabase
        .from('author_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (regsError) throw regsError;
      if (!regs) return [];

      // Buscar os perfis dos usuários
      const userIds = [...new Set(regs.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, artistic_name')
        .in('id', userIds);

      // Mapear perfis aos registros
      return regs.map(reg => ({
        ...reg,
        profile: profiles?.find(p => p.id === reg.user_id) || null
      })) as Registration[];
    }
  });

  // Mutation para editar registro
  const editMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Registration> }) => {
      const { error } = await supabase
        .from('author_registrations')
        .update({
          title: data.updates.title,
          author: data.updates.author,
          other_authors: data.updates.other_authors || null,
          lyrics: data.updates.lyrics,
          genre: data.updates.genre,
          rhythm: data.updates.rhythm,
          song_version: data.updates.song_version,
          additional_info: data.updates.additional_info || null,
          status: data.updates.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Registro atualizado com sucesso!',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      setIsEditModalOpen(false);
      setSelectedRegistration(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar registro',
        variant: 'destructive',
      });
    }
  });

  // Mutation para excluir registro
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('author_registrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Registro excluído com sucesso!',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir registro',
        variant: 'destructive',
      });
    }
  });

  const handleEdit = (registration: Registration) => {
    setSelectedRegistration(registration);
    setEditForm({
      title: registration.title,
      author: registration.author,
      other_authors: registration.other_authors || '',
      lyrics: registration.lyrics,
      genre: registration.genre,
      rhythm: registration.rhythm,
      song_version: registration.song_version,
      additional_info: registration.additional_info || '',
      status: registration.status
    });
    setIsEditModalOpen(true);
  };

  const handleView = (registration: Registration) => {
    setSelectedRegistration(registration);
    setIsViewModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedRegistration) return;
    editMutation.mutate({
      id: selectedRegistration.id,
      updates: editForm
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
      case 'completed':
        return <Badge className="bg-green-500">Registrado</Badge>;
      case 'em análise':
        return <Badge className="bg-yellow-500">Em Análise</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredRegistrations = registrations?.filter(reg => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      reg.title?.toLowerCase().includes(search) ||
      reg.author?.toLowerCase().includes(search) ||
      reg.profile?.name?.toLowerCase().includes(search) ||
      reg.profile?.email?.toLowerCase().includes(search) ||
      reg.hash?.toLowerCase().includes(search)
    );
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            Gerenciar Registros de Obras
          </h2>
          <p className="text-muted-foreground">
            Edite ou exclua registros de obras autorais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por título, autor, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{filteredRegistrations.length} registros</Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Carregando registros...
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum registro encontrado
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Gênero</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {registration.title}
                  </TableCell>
                  <TableCell>{registration.author}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{registration.profile?.name || '-'}</p>
                      <p className="text-muted-foreground text-xs">
                        {registration.profile?.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{registration.genre}</TableCell>
                  <TableCell>{getStatusBadge(registration.status)}</TableCell>
                  <TableCell>
                    {new Date(registration.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(registration)}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(registration)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" title="Excluir">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o registro "{registration.title}"?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(registration.id)}
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

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Título</Label>
                  <p className="font-medium">{selectedRegistration.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Autor</Label>
                  <p className="font-medium">{selectedRegistration.author}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Outros Autores</Label>
                  <p>{selectedRegistration.other_authors || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gênero</Label>
                  <p>{selectedRegistration.genre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ritmo</Label>
                  <p>{selectedRegistration.rhythm}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Versão</Label>
                  <p>{selectedRegistration.song_version}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>{getStatusBadge(selectedRegistration.status)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hash</Label>
                  <p className="text-xs font-mono break-all">{selectedRegistration.hash || '-'}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Letra</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap max-h-60 overflow-y-auto text-sm">
                  {selectedRegistration.lyrics}
                </div>
              </div>
              {selectedRegistration.additional_info && (
                <div>
                  <Label className="text-muted-foreground">Informações Adicionais</Label>
                  <p className="mt-1">{selectedRegistration.additional_info}</p>
                </div>
              )}
              {selectedRegistration.audio_file_path && (
                <div>
                  <Label className="text-muted-foreground">Áudio</Label>
                  <div className="mt-1">
                    <audio controls className="w-full">
                      <source src={selectedRegistration.audio_file_path} />
                    </audio>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias nos dados do registro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={editForm.author}
                  onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_authors">Outros Autores</Label>
                <Input
                  id="other_authors"
                  value={editForm.other_authors}
                  onChange={(e) => setEditForm({ ...editForm, other_authors: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genre">Gênero</Label>
                <Input
                  id="genre"
                  value={editForm.genre}
                  onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rhythm">Ritmo</Label>
                <Input
                  id="rhythm"
                  value={editForm.rhythm}
                  onChange={(e) => setEditForm({ ...editForm, rhythm: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="song_version">Versão</Label>
                <Input
                  id="song_version"
                  value={editForm.song_version}
                  onChange={(e) => setEditForm({ ...editForm, song_version: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="em análise">Em Análise</SelectItem>
                    <SelectItem value="registered">Registrado</SelectItem>
                    <SelectItem value="completed">Completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lyrics">Letra</Label>
              <Textarea
                id="lyrics"
                value={editForm.lyrics}
                onChange={(e) => setEditForm({ ...editForm, lyrics: e.target.value })}
                rows={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additional_info">Informações Adicionais</Label>
              <Textarea
                id="additional_info"
                value={editForm.additional_info}
                onChange={(e) => setEditForm({ ...editForm, additional_info: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={editMutation.isPending}>
              {editMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
