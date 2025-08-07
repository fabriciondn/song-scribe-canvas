import React, { useState } from 'react';
import { useMenuFunctions } from '@/hooks/useMenuFunctions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Edit, Trash2, Settings } from 'lucide-react';
import { MenuFunction } from '@/services/menuFunctionService';

const statusLabels = {
  available: 'Disponível',
  beta: 'Beta',
  coming_soon: 'Em Breve'
};

const statusColors = {
  available: 'default',
  beta: 'secondary',
  coming_soon: 'destructive'
} as const;

export function AdminMenuFunctions() {
  const { functions, loading, updateFunctionStatus, updateFunction, createFunction, deleteFunction } = useMenuFunctions();
  const [editingFunction, setEditingFunction] = useState<MenuFunction | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    function_key: '',
    name: '',
    description: '',
    status: 'available' as MenuFunction['status'],
    icon: '',
    route: ''
  });

  const handleStatusChange = async (functionId: string, newStatus: MenuFunction['status']) => {
    await updateFunctionStatus(functionId, newStatus);
  };

  const handleCreateFunction = async () => {
    await createFunction(formData);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleUpdateFunction = async () => {
    if (editingFunction) {
      await updateFunction(editingFunction.id, formData);
      setIsEditDialogOpen(false);
      setEditingFunction(null);
      resetForm();
    }
  };

  const handleDeleteFunction = async (functionId: string) => {
    if (confirm('Tem certeza que deseja remover esta função?')) {
      await deleteFunction(functionId);
    }
  };

  const resetForm = () => {
    setFormData({
      function_key: '',
      name: '',
      description: '',
      status: 'available',
      icon: '',
      route: ''
    });
  };

  const openEditDialog = (func: MenuFunction) => {
    setEditingFunction(func);
    setFormData({
      function_key: func.function_key,
      name: func.name,
      description: func.description || '',
      status: func.status,
      icon: func.icon || '',
      route: func.route || ''
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando funções...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Funções do Menu</h2>
          <p className="text-muted-foreground">
            Controle o status e disponibilidade das funções do sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Função
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Função</DialogTitle>
              <DialogDescription>
                Adicione uma nova função ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="function_key" className="text-right">
                  Chave
                </Label>
                <Input
                  id="function_key"
                  value={formData.function_key}
                  onChange={(e) => setFormData({ ...formData, function_key: e.target.value })}
                  className="col-span-3"
                  placeholder="ex: nova-funcao"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Nome da função"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Descrição da função"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="route" className="text-right">
                  Rota
                </Label>
                <Input
                  id="route"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  className="col-span-3"
                  placeholder="/nova-funcao"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="icon" className="text-right">
                  Ícone
                </Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="col-span-3"
                  placeholder="Settings"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value: MenuFunction['status']) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="beta">Beta</SelectItem>
                    <SelectItem value="coming_soon">Em Breve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateFunction}>Criar Função</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {functions.map((func) => (
          <Card key={func.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <CardTitle className="text-lg">{func.name}</CardTitle>
                    <CardDescription>{func.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={statusColors[func.status]}>
                    {statusLabels[func.status]}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(func)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteFunction(func.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <strong>Chave:</strong> {func.function_key}
                  </p>
                  {func.route && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Rota:</strong> {func.route}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor={`status-${func.id}`} className="text-sm">
                    Alterar Status:
                  </Label>
                  <Select
                    value={func.status}
                    onValueChange={(value: MenuFunction['status']) => handleStatusChange(func.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponível</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                      <SelectItem value="coming_soon">Em Breve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Função</DialogTitle>
            <DialogDescription>
              Modifique os dados da função
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_function_key" className="text-right">
                Chave
              </Label>
              <Input
                id="edit_function_key"
                value={formData.function_key}
                onChange={(e) => setFormData({ ...formData, function_key: e.target.value })}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_name" className="text-right">
                Nome
              </Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_route" className="text-right">
                Rota
              </Label>
              <Input
                id="edit_route"
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_icon" className="text-right">
                Ícone
              </Label>
              <Input
                id="edit_icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_status" className="text-right">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value: MenuFunction['status']) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="coming_soon">Em Breve</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateFunction}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}