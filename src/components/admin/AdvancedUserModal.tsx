import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Music, FileText, FolderOpen, Calendar, CreditCard, Download, Coins, User, Activity, Award } from 'lucide-react';

interface AdvancedUserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void;
}

export const AdvancedUserModal: React.FC<AdvancedUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(user?.credits || 0);
  const [moderatorNotes, setModeratorNotes] = useState(user?.moderator_notes || '');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setCredits(user.credits || 0);
      setModeratorNotes(user.moderator_notes || '');
    }
  }, [user]);

  // Buscar estatísticas do usuário
  const { data: userStats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [songs, drafts, registrations, folders, transactions] = await Promise.all([
        // Músicas
        supabase
          .from('songs')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .is('deleted_at', null),
        
        // Rascunhos
        supabase
          .from('drafts')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .is('deleted_at', null),
        
        // Registros de autor
        supabase
          .from('author_registrations')
          .select('id, title, status, created_at')
          .eq('user_id', user.id),
        
        // Pastas
        supabase
          .from('folders')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .is('deleted_at', null),
        
        // Transações de crédito
        supabase
          .from('credit_transactions')
          .select('id, credits_purchased, total_amount, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      return {
        songs: songs.data || [],
        drafts: drafts.data || [],
        registrations: registrations.data || [],
        folders: folders.data || [],
        transactions: transactions.data || []
      };
    },
    enabled: isOpen && !!user?.id,
  });

  const handleUpdateCredits = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits })
        .eq('id', user.id);

      if (error) throw error;

      // Log da atividade
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'credits_updated_by_admin',
          metadata: {
            admin_user_id: (await supabase.auth.getUser()).data.user?.id,
            old_credits: user.credits,
            new_credits: credits
          }
        });

      toast({
        title: 'Sucesso',
        description: 'Créditos atualizados com sucesso',
      });

      onUserUpdate();
    } catch (error) {
      console.error('Erro ao atualizar créditos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar créditos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ moderator_notes: moderatorNotes })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Notas atualizadas com sucesso',
      });

      onUserUpdate();
    } catch (error) {
      console.error('Erro ao atualizar notas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar notas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCertificate = async (registrationId: string) => {
    try {
      // Aqui você implementaria a lógica para gerar/baixar o certificado
      toast({
        title: 'Certificado',
        description: 'Funcionalidade de download do certificado será implementada',
      });
    } catch (error) {
      console.error('Erro ao baixar certificado:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao baixar certificado',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  const stats = userStats;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar_url} alt={user.name} />
              <AvatarFallback>{user.name?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{user.name || 'Sem nome'}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="management">Gerenciar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Músicas</CardTitle>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.songs?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.drafts?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Registros</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.registrations?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Créditos</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.credits || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Informações do perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome Artístico</Label>
                  <p className="text-sm">{user.artistic_name || 'Não informado'}</p>
                </div>
                <div>
                  <Label>CPF</Label>
                  <p className="text-sm">{user.cpf || 'Não informado'}</p>
                </div>
                <div>
                  <Label>Telefone</Label>
                  <p className="text-sm">{user.cellphone || 'Não informado'}</p>
                </div>
                <div>
                  <Label>Data de Nascimento</Label>
                  <p className="text-sm">
                    {user.birth_date ? new Date(user.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}
                  </p>
                </div>
                {(user.street || user.city || user.state) && (
                  <div className="col-span-2">
                    <Label>Endereço Completo</Label>
                    <p className="text-sm">
                      {[user.street, user.number, user.neighborhood, user.city, user.state, user.cep]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {/* Obras registradas */}
            {stats?.registrations && stats.registrations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Obras Registradas ({stats.registrations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.registrations.map((registration: any) => (
                        <TableRow key={registration.id}>
                          <TableCell>{registration.title}</TableCell>
                          <TableCell>
                            <Badge variant={registration.status === 'completed' ? 'default' : 'secondary'}>
                              {registration.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(registration.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadCertificate(registration.id)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Certificado
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Músicas e rascunhos em uma tabela compacta */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {stats?.songs && stats.songs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      Músicas Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.songs.slice(0, 5).map((song: any) => (
                        <div key={song.id} className="flex justify-between items-center">
                          <span className="text-sm truncate">{song.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(song.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ))}
                      {stats.songs.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          E mais {stats.songs.length - 5} música{stats.songs.length - 5 !== 1 ? 's' : ''}...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats?.drafts && stats.drafts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Rascunhos Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.drafts.slice(0, 5).map((draft: any) => (
                        <div key={draft.id} className="flex justify-between items-center">
                          <span className="text-sm truncate">{draft.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(draft.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ))}
                      {stats.drafts.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          E mais {stats.drafts.length - 5} rascunho{stats.drafts.length - 5 !== 1 ? 's' : ''}...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Histórico de Transações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.transactions && stats.transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Créditos</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.transactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.credits_purchased}</TableCell>
                          <TableCell>R$ {transaction.total_amount}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma transação encontrada
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="space-y-4">
            {/* Gestão de créditos */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Créditos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="credits">Créditos</Label>
                    <Input
                      id="credits"
                      type="number"
                      value={credits}
                      onChange={(e) => setCredits(Number(e.target.value))}
                      min="0"
                    />
                  </div>
                  <Button onClick={handleUpdateCredits} disabled={isLoading}>
                    Atualizar Créditos
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notas do moderador */}
            <Card>
              <CardHeader>
                <CardTitle>Notas do Administrador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  rows={4}
                  placeholder="Adicione notas sobre este usuário..."
                />
                <Button onClick={handleUpdateNotes} disabled={isLoading}>
                  Salvar Notas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};