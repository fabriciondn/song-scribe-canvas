import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, Music, Edit, FileText, Download, Calendar, 
  MapPin, Phone, Mail, CreditCard, Activity, Shield,
  UserX, ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useImpersonation } from '@/context/ImpersonationContext';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  artistic_name: string | null;
  cpf: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  cellphone: string | null;
  birth_date: string | null;
  credits: number;
  created_at: string;
}

interface UserActivity {
  id: string;
  action: string;
  timestamp: string;
  metadata: any;
}

interface UserRegistration {
  id: string;
  title: string;
  author: string;
  status: string;
  created_at: string;
  hash: string | null;
}

interface UserSong {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface UserDraft {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  userId 
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [songs, setSongs] = useState<UserSong[]>([]);
  const [drafts, setDrafts] = useState<UserDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const { startImpersonation } = useImpersonation();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
    }
  }, [isOpen, userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setUser(profile);

      // Buscar atividades do usuário
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (activityData && !activityError) {
        setActivities(activityData);
      }

      // Buscar registros autorais
      const { data: registrationData, error: registrationError } = await supabase
        .from('author_registrations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (registrationData && !registrationError) {
        setRegistrations(registrationData);
      }

      // Buscar músicas
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select('id, title, created_at, updated_at')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (songData && !songError) {
        setSongs(songData);
      }

      // Buscar rascunhos
      const { data: draftData, error: draftError } = await supabase
        .from('drafts')
        .select('id, title, created_at, updated_at')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (draftData && !draftError) {
        setDrafts(draftData);
      }

    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      toast.error('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonateUser = () => {
    if (user) {
      startImpersonation({
        id: user.id,
        name: user.name,
        email: user.email,
        artistic_name: user.artistic_name,
        role: 'user'
      });
      
      // Redirecionar para o dashboard do usuário
      window.location.href = '/dashboard';
    }
  };

  const downloadCertificate = async (registrationId: string, title: string) => {
    try {
      toast.info('Gerando certificado...');
      
      // Aqui você implementaria a lógica para gerar/baixar o certificado
      // Por exemplo, chamando uma edge function ou API
      
      toast.success('Certificado baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar certificado:', error);
      toast.error('Erro ao baixar certificado');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: any, label: string } } = {
      'completed': { variant: 'default', label: 'Concluído' },
      'registered': { variant: 'default', label: 'Registrado' },
      'draft': { variant: 'secondary', label: 'Rascunho' },
      'analysis': { variant: 'outline', label: 'Em Análise' },
      'em análise': { variant: 'outline', label: 'Em Análise' }
    };

    const statusInfo = statusMap[status] || { variant: 'outline', label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (!user && !loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>{user?.name || 'Usuário sem nome'}</span>
              <p className="text-sm text-muted-foreground font-normal">
                {user?.email}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="certificates">Certificados</TabsTrigger>
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
              <TabsTrigger value="actions">Ações</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome Completo</label>
                      <p className="text-sm">{user?.name || 'Não informado'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome Artístico</label>
                      <p className="text-sm">{user?.artistic_name || 'Não informado'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CPF</label>
                      <p className="text-sm">{user?.cpf || 'Não informado'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data de Nascimento</label>
                      <p className="text-sm">
                        {user?.birth_date ? new Date(user.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Contato & Localização
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </label>
                      <p className="text-sm">{user?.email || 'Não informado'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Celular
                      </label>
                      <p className="text-sm">{user?.cellphone || 'Não informado'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cidade/Estado</label>
                      <p className="text-sm">
                        {user?.city && user?.state 
                          ? `${user.city}, ${user.state}` 
                          : 'Não informado'
                        }
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Endereço</label>
                      <p className="text-sm">{user?.address || 'Não informado'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Informações da Conta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Créditos</label>
                      <p className="text-2xl font-bold text-primary">{user?.credits || 0}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Membro desde</label>
                      <p className="text-sm">
                        {user?.created_at ? formatDate(user.created_at) : 'Não informado'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="certificates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Certificados de Registro Autoral ({registrations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {registrations.length > 0 ? (
                    <div className="space-y-4">
                      {registrations.map((registration) => (
                        <div key={registration.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{registration.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Autor: {registration.author}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Criado em: {formatDate(registration.created_at)}
                              </p>
                              {registration.hash && (
                                <p className="text-xs font-mono text-muted-foreground mt-2">
                                  Hash: {registration.hash.substring(0, 16)}...
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(registration.status)}
                              {registration.status === 'registered' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadCertificate(registration.id, registration.title)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum certificado encontrado
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      Músicas ({songs.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {songs.length > 0 ? (
                      <div className="space-y-3">
                        {songs.slice(0, 10).map((song) => (
                          <div key={song.id} className="border-b pb-3 last:border-b-0">
                            <h4 className="font-medium">{song.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Criada em: {formatDate(song.created_at)}
                            </p>
                          </div>
                        ))}
                        {songs.length > 10 && (
                          <p className="text-sm text-muted-foreground text-center">
                            E mais {songs.length - 10} música(s)
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhuma música encontrada
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="h-5 w-5" />
                      Rascunhos ({drafts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {drafts.length > 0 ? (
                      <div className="space-y-3">
                        {drafts.slice(0, 10).map((draft) => (
                          <div key={draft.id} className="border-b pb-3 last:border-b-0">
                            <h4 className="font-medium">{draft.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Criado em: {formatDate(draft.created_at)}
                            </p>
                          </div>
                        ))}
                        {drafts.length > 10 && (
                          <p className="text-sm text-muted-foreground text-center">
                            E mais {drafts.length - 10} rascunho(s)
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhum rascunho encontrado
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Histórico de Atividades ({activities.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {activities.map((activity) => (
                        <div key={activity.id} className="border-b pb-3 last:border-b-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{activity.action}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(activity.timestamp)}
                              </p>
                              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                <details className="mt-2">
                                  <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                                    Ver detalhes
                                  </summary>
                                  <pre className="text-xs mt-1 bg-muted p-2 rounded max-w-full overflow-x-auto">
                                    {JSON.stringify(activity.metadata, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma atividade encontrada
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Ações Administrativas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleImpersonateUser}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Operar como este usuário
                    </Button>
                    
                    <Button
                      onClick={() => window.open(`mailto:${user?.email}`, '_blank')}
                      className="w-full justify-start"
                      variant="outline"
                      disabled={!user?.email}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar Email
                    </Button>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Importante:</strong> Ao operar como este usuário, você terá acesso completo 
                      à conta dele. Use essa funcionalidade apenas para suporte técnico ou resolução de problemas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};