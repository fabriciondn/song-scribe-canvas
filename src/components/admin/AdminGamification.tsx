import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Music, Plus, Edit, Trash2, Star, Gift, TrendingUp, Users, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getAcordeActions, 
  createAcordeAction, 
  updateAcordeAction, 
  deleteAcordeAction,
  getAcordeStats,
  AcordeAction,
  AcordeStats
} from '@/services/acordeService';

export function AdminGamification() {
  const [actions, setActions] = useState<AcordeAction[]>([]);
  const [stats, setStats] = useState<AcordeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<AcordeAction | null>(null);
  const [formData, setFormData] = useState({
    action_key: '',
    name: '',
    description: '',
    acordes_reward: 1,
    icon: 'Star',
    max_per_user: null as number | null,
    is_active: true
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [actionsData, statsData] = await Promise.all([
        getAcordeActions(),
        getAcordeStats()
      ]);
      setActions(actionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      toast.error('Erro ao carregar dados de gamificação');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      action_key: '',
      name: '',
      description: '',
      acordes_reward: 1,
      icon: 'Star',
      max_per_user: null,
      is_active: true
    });
    setEditingAction(null);
  };

  const openEditDialog = (action: AcordeAction) => {
    setEditingAction(action);
    setFormData({
      action_key: action.action_key,
      name: action.name,
      description: action.description || '',
      acordes_reward: action.acordes_reward,
      icon: action.icon || 'Star',
      max_per_user: action.max_per_user,
      is_active: action.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.action_key || !formData.name) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      if (editingAction) {
        const success = await updateAcordeAction(editingAction.id, formData);
        if (success) {
          toast.success('Ação atualizada com sucesso');
        } else {
          toast.error('Erro ao atualizar ação');
          return;
        }
      } else {
        const newAction = await createAcordeAction(formData);
        if (newAction) {
          toast.success('Ação criada com sucesso');
        } else {
          toast.error('Erro ao criar ação');
          return;
        }
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving action:', error);
      toast.error('Erro ao salvar ação');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ação?')) return;

    const success = await deleteAcordeAction(id);
    if (success) {
      toast.success('Ação excluída com sucesso');
      fetchData();
    } else {
      toast.error('Erro ao excluir ação');
    }
  };

  const toggleActive = async (action: AcordeAction) => {
    const success = await updateAcordeAction(action.id, { is_active: !action.is_active });
    if (success) {
      toast.success(action.is_active ? 'Ação desativada' : 'Ação ativada');
      fetchData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            Gamificação - Acordes
          </h2>
          <p className="text-muted-foreground">
            Gerencie as ações que concedem acordes aos usuários
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Coins className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats?.total_acordes_distributed || 0}</p>
                <p className="text-xs text-muted-foreground">Acordes Distribuídos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Gift className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats?.total_acordes_redeemed || 0}</p>
                <p className="text-xs text-muted-foreground">Acordes Resgatados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats?.total_users_with_acordes || 0}</p>
                <p className="text-xs text-muted-foreground">Usuários com Acordes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats?.total_redemptions || 0}</p>
                <p className="text-xs text-muted-foreground">Resgates Realizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Music className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Como funciona</p>
              <p className="text-sm text-muted-foreground">
                Cada acorde vale R$ 1,00. Os usuários precisam acumular 30 acordes para resgatar 1 crédito (R$ 30,00).
                Configure as ações abaixo para definir quantos acordes cada ação concede.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Ações Configuradas</CardTitle>
            <CardDescription>
              {actions.length} {actions.length === 1 ? 'ação configurada' : 'ações configuradas'}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Ação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAction ? 'Editar Ação' : 'Nova Ação'}</DialogTitle>
                <DialogDescription>
                  Configure uma ação que concede acordes aos usuários
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="action_key">Chave da Ação *</Label>
                  <Input
                    id="action_key"
                    placeholder="ex: daily_login"
                    value={formData.action_key}
                    onChange={(e) => setFormData({ ...formData, action_key: e.target.value })}
                    disabled={!!editingAction}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="ex: Login Diário"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva a ação..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="acordes_reward">Acordes de Recompensa</Label>
                    <Input
                      id="acordes_reward"
                      type="number"
                      min="1"
                      value={formData.acordes_reward}
                      onChange={(e) => setFormData({ ...formData, acordes_reward: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_per_user">Limite por Usuário</Label>
                    <Input
                      id="max_per_user"
                      type="number"
                      min="0"
                      placeholder="Ilimitado"
                      value={formData.max_per_user || ''}
                      onChange={(e) => setFormData({ ...formData, max_per_user: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Ícone</Label>
                  <Input
                    id="icon"
                    placeholder="ex: Star, Camera, FileText"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Ativo</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingAction ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {actions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{action.name}</p>
                      <Badge variant={action.is_active ? 'default' : 'secondary'}>
                        {action.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Chave: {action.action_key} • 
                      Limite: {action.max_per_user ? `${action.max_per_user}x` : 'Ilimitado'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">+{action.acordes_reward}</p>
                    <p className="text-xs text-muted-foreground">acordes</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={action.is_active}
                      onCheckedChange={() => toggleActive(action)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(action)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(action.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {actions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma ação configurada. Clique em "Nova Ação" para começar.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
