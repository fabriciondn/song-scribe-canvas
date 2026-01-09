import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Gift, 
  Calendar, 
  Users, 
  Hash, 
  Eye, 
  EyeOff, 
  Save, 
  Loader2, 
  Trophy,
  Settings,
  FileText,
  BarChart3,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RaffleSettings {
  id: string;
  name: string;
  description: string | null;
  total_numbers: number;
  min_number: number;
  max_number: number;
  is_active: boolean;
  is_visible_in_menu: boolean;
  draw_date: string | null;
  prize_description: string | null;
  prize_image_url: string | null;
  rules: string | null;
  base_numbers_for_pro: number;
  numbers_per_credit: number;
  created_at: string;
  updated_at: string;
}

interface RaffleReservation {
  id: string;
  raffle_id: string;
  user_id: string;
  number: number;
  reserved_at: string;
}

export const AdminRaffle: React.FC = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<RaffleSettings>>({});

  // Buscar configurações do sorteio
  const { data: raffleSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['raffle-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raffle_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as RaffleSettings | null;
    }
  });

  // Buscar reservas
  const { data: reservations, isLoading: loadingReservations } = useQuery({
    queryKey: ['raffle-reservations', raffleSettings?.id],
    queryFn: async () => {
      if (!raffleSettings?.id) return [];
      
      const { data, error } = await supabase
        .from('raffle_reservations')
        .select('*')
        .eq('raffle_id', raffleSettings.id)
        .order('number', { ascending: true });
      
      if (error) throw error;
      return data as RaffleReservation[];
    },
    enabled: !!raffleSettings?.id
  });

  // Buscar perfis dos participantes
  const { data: participants } = useQuery({
    queryKey: ['raffle-participants', reservations],
    queryFn: async () => {
      if (!reservations || reservations.length === 0) return [];
      
      const userIds = [...new Set(reservations.map(r => r.user_id))];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, artistic_name')
        .in('id', userIds);
      
      if (error) throw error;
      return data;
    },
    enabled: !!reservations && reservations.length > 0
  });

  // Mutation para atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<RaffleSettings>) => {
      if (!raffleSettings?.id) {
        // Criar nova configuração
        const { data, error } = await supabase
          .from('raffle_settings')
          .insert([updates])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('raffle_settings')
        .update(updates)
        .eq('id', raffleSettings.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raffle-settings'] });
      toast.success('Configurações salvas com sucesso!');
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    }
  });

  // Mutation para limpar todas as reservas
  const clearReservationsMutation = useMutation({
    mutationFn: async () => {
      if (!raffleSettings?.id) throw new Error('Sorteio não encontrado');

      const { error } = await supabase
        .from('raffle_reservations')
        .delete()
        .eq('raffle_id', raffleSettings.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raffle-reservations'] });
      toast.success('Todas as reservas foram removidas!');
    },
    onError: (error) => {
      console.error('Erro ao limpar reservas:', error);
      toast.error('Erro ao limpar reservas');
    }
  });

  const handleStartEdit = () => {
    setFormData(raffleSettings || {});
    setIsEditing(true);
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({});
    setIsEditing(false);
  };

  const uniqueParticipants = participants?.length || 0;
  const totalReservations = reservations?.length || 0;
  const availableNumbers = (raffleSettings?.total_numbers || 0) - totalReservations;

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gift className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Sorteio</h2>
            <p className="text-muted-foreground">Configure e gerencie os sorteios da plataforma</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button onClick={handleStartEdit} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Editar Configurações
            </Button>
          ) : (
            <>
              <Button onClick={handleCancel} variant="ghost">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
                {updateSettingsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Números</p>
                <p className="text-2xl font-bold">{raffleSettings?.total_numbers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Trophy className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Números Reservados</p>
                <p className="text-2xl font-bold">{totalReservations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
                <p className="text-2xl font-bold">{availableNumbers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Participantes</p>
                <p className="text-2xl font-bold">{uniqueParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações do Sorteio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações do Sorteio
            </CardTitle>
            <CardDescription>
              Defina as regras e parâmetros do sorteio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Nome do Sorteio</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Sorteio da Guitarra"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do sorteio..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total de Números</Label>
                    <Input
                      type="number"
                      value={formData.total_numbers || 1000}
                      onChange={(e) => setFormData({ ...formData, total_numbers: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data do Sorteio</Label>
                    <Input
                      type="datetime-local"
                      value={formData.draw_date?.slice(0, 16) || ''}
                      onChange={(e) => setFormData({ ...formData, draw_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição do Prêmio</Label>
                  <Input
                    value={formData.prize_description || ''}
                    onChange={(e) => setFormData({ ...formData, prize_description: e.target.value })}
                    placeholder="Ex: Guitarra Fender Stratocaster"
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL da Imagem do Prêmio</Label>
                  <Input
                    value={formData.prize_image_url || ''}
                    onChange={(e) => setFormData({ ...formData, prize_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Números Base para PRO</Label>
                    <Input
                      type="number"
                      value={formData.base_numbers_for_pro || 1}
                      onChange={(e) => setFormData({ ...formData, base_numbers_for_pro: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">Quantos números o assinante PRO recebe por padrão</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Números por Crédito</Label>
                    <Input
                      type="number"
                      value={formData.numbers_per_credit || 1}
                      onChange={(e) => setFormData({ ...formData, numbers_per_credit: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">Quantos números extras a cada crédito comprado</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sorteio Ativo</Label>
                    <p className="text-xs text-muted-foreground">Permite que usuários participem</p>
                  </div>
                  <Switch
                    checked={formData.is_active ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Visível no Menu</Label>
                    <p className="text-xs text-muted-foreground">Exibe a opção de sorteio no menu</p>
                  </div>
                  <Switch
                    checked={formData.is_visible_in_menu ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_visible_in_menu: checked })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="font-medium">{raffleSettings?.name || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total de Números</span>
                    <span className="font-medium">{raffleSettings?.total_numbers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Data do Sorteio</span>
                    <span className="font-medium">
                      {raffleSettings?.draw_date 
                        ? format(new Date(raffleSettings.draw_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Prêmio</span>
                    <span className="font-medium">{raffleSettings?.prize_description || '-'}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Números Base PRO</span>
                    <Badge variant="secondary">{raffleSettings?.base_numbers_for_pro || 1}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Números por Crédito</span>
                    <Badge variant="secondary">{raffleSettings?.numbers_per_credit || 1}</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={raffleSettings?.is_active ? 'default' : 'destructive'}>
                      {raffleSettings?.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Visibilidade</span>
                    <div className="flex items-center gap-2">
                      {raffleSettings?.is_visible_in_menu ? (
                        <>
                          <Eye className="h-4 w-4 text-green-500" />
                          <span className="text-green-500">Visível</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-red-500" />
                          <span className="text-red-500">Oculto</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Regras do Sorteio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Regras do Sorteio
            </CardTitle>
            <CardDescription>
              Defina as regras de participação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={formData.rules || ''}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder="Descreva as regras do sorteio..."
                rows={12}
              />
            ) : (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {raffleSettings?.rules || 'Nenhuma regra definida.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista de Participantes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participantes ({totalReservations} números reservados)
              </CardTitle>
              <CardDescription>
                Usuários que já escolheram seus números
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['raffle-reservations'] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={totalReservations === 0}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Reservas
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar todas as reservas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todas as {totalReservations} reservas serão removidas 
                      e os participantes perderão seus números.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => clearReservationsMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {clearReservationsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Limpar Tudo'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingReservations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reservations && reservations.length > 0 ? (
            <div className="space-y-4">
              {/* Resumo por participante */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {participants?.map((participant) => {
                  const userReservations = reservations.filter(r => r.user_id === participant.id);
                  return (
                    <div key={participant.id} className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{participant.name || participant.artistic_name || 'Usuário'}</span>
                        <Badge variant="secondary">{userReservations.length} números</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{participant.email}</p>
                      <div className="flex flex-wrap gap-1">
                        {userReservations.slice(0, 10).map(r => (
                          <Badge key={r.id} variant="outline" className="text-xs">
                            {String(r.number).padStart(3, '0')}
                          </Badge>
                        ))}
                        {userReservations.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{userReservations.length - 10}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma reserva encontrada</p>
              <p className="text-sm">Os participantes aparecerão aqui quando escolherem seus números</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
