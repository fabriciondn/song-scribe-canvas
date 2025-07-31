import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Music, FileText, Briefcase, Award, Search, Eye } from 'lucide-react';

export const AdminContent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar músicas
  const { data: songs, isLoading: songsLoading } = useQuery({
    queryKey: ['admin-songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select(`
          id,
          title,
          content,
          created_at,
          updated_at,
          user_id
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar rascunhos
  const { data: drafts, isLoading: draftsLoading } = useQuery({
    queryKey: ['admin-drafts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drafts')
        .select(`
          id,
          title,
          content,
          created_at,
          updated_at,
          user_id
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar parcerias
  const { data: partnerships, isLoading: partnershipsLoading } = useQuery({
    queryKey: ['admin-partnerships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partnerships')
        .select(`
          id,
          title,
          description,
          created_at,
          updated_at,
          user_id
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar registros de autoria
  const { data: registrations, isLoading: registrationsLoading } = useQuery({
    queryKey: ['admin-registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('author_registrations')
        .select(`
          id,
          title,
          author,
          genre,
          status,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredSongs = songs?.filter(song =>
    song.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredDrafts = drafts?.filter(draft =>
    draft.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredPartnerships = partnerships?.filter(partnership =>
    partnership.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredRegistrations = registrations?.filter(registration =>
    registration.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    registration.author?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: any } } = {
      draft: { label: 'Rascunho', variant: 'secondary' },
      submitted: { label: 'Enviado', variant: 'default' },
      approved: { label: 'Aprovado', variant: 'default' },
      rejected: { label: 'Rejeitado', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Conteúdo</CardTitle>
          <CardDescription>
            Visualize e gerencie todo o conteúdo da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barra de Pesquisa */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue="songs" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="songs" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                Músicas ({songs?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="drafts" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Rascunhos ({drafts?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="partnerships" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Parcerias ({partnerships?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="registrations" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Registros ({registrations?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Tabela de Músicas */}
            <TabsContent value="songs">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Última Atualização</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {songsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSongs.map((song) => (
                        <TableRow key={song.id}>
                          <TableCell className="font-medium">{song.title}</TableCell>
                          <TableCell>ID: {song.user_id}</TableCell>
                          <TableCell>{new Date(song.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{new Date(song.updated_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Visualizar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {!songsLoading && filteredSongs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma música encontrada</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tabela de Rascunhos */}
            <TabsContent value="drafts">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Última Atualização</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDrafts.map((draft) => (
                        <TableRow key={draft.id}>
                          <TableCell className="font-medium">{draft.title}</TableCell>
                          <TableCell>ID: {draft.user_id}</TableCell>
                          <TableCell>{new Date(draft.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{new Date(draft.updated_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Visualizar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {!draftsLoading && filteredDrafts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum rascunho encontrado</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tabela de Parcerias */}
            <TabsContent value="partnerships">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Criador</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnershipsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPartnerships.map((partnership) => (
                        <TableRow key={partnership.id}>
                          <TableCell className="font-medium">{partnership.title}</TableCell>
                          <TableCell>ID: {partnership.user_id}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {partnership.description || 'Sem descrição'}
                          </TableCell>
                          <TableCell>{new Date(partnership.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Visualizar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {!partnershipsLoading && filteredPartnerships.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma parceria encontrada</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tabela de Registros */}
            <TabsContent value="registrations">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Gênero</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrationsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRegistrations.map((registration) => (
                        <TableRow key={registration.id}>
                          <TableCell className="font-medium">{registration.title}</TableCell>
                          <TableCell>{registration.author}</TableCell>
                          <TableCell>{registration.genre}</TableCell>
                          <TableCell>{getStatusBadge(registration.status)}</TableCell>
                          <TableCell>{new Date(registration.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Visualizar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {!registrationsLoading && filteredRegistrations.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum registro encontrado</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};