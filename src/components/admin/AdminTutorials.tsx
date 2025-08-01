import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Play, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

const categories = [
  { value: 'getting-started', label: 'Primeiros Passos' },
  { value: 'composer', label: 'Compositor' },
  { value: 'collaboration', label: 'Colaboração' },
  { value: 'advanced', label: 'Avançado' },
  { value: 'tips', label: 'Dicas e Truques' },
];

export const AdminTutorials: React.FC = () => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    category: '',
    is_active: true,
  });

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTutorials(data || []);
    } catch (error) {
      console.error('Erro ao buscar tutoriais:', error);
      toast.error('Erro ao carregar tutoriais');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.video_url || !formData.category) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        order_index: editingTutorial?.order_index ?? tutorials.length,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      if (editingTutorial) {
        const { error } = await supabase
          .from('tutorials')
          .update(dataToSubmit)
          .eq('id', editingTutorial.id);

        if (error) throw error;
        toast.success('Tutorial atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('tutorials')
          .insert([dataToSubmit]);

        if (error) throw error;
        toast.success('Tutorial criado com sucesso');
      }

      setDialogOpen(false);
      resetForm();
      fetchTutorials();
    } catch (error) {
      console.error('Erro ao salvar tutorial:', error);
      toast.error('Erro ao salvar tutorial');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      category: '',
      is_active: true,
    });
    setEditingTutorial(null);
  };

  const handleEdit = (tutorial: Tutorial) => {
    setEditingTutorial(tutorial);
    setFormData({
      title: tutorial.title,
      description: tutorial.description,
      video_url: tutorial.video_url,
      thumbnail_url: tutorial.thumbnail_url,
      category: tutorial.category,
      is_active: tutorial.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tutorial?')) return;

    try {
      const { error } = await supabase
        .from('tutorials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Tutorial excluído com sucesso');
      fetchTutorials();
    } catch (error) {
      console.error('Erro ao excluir tutorial:', error);
      toast.error('Erro ao excluir tutorial');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tutorials')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Tutorial ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`);
      fetchTutorials();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do tutorial');
    }
  };

  const updateOrder = async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('tutorials')
        .update({ order_index: newOrder })
        .eq('id', id);

      if (error) throw error;
      fetchTutorials();
    } catch (error) {
      console.error('Erro ao reordenar:', error);
      toast.error('Erro ao reordenar tutorial');
    }
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Tutoriais</h2>
          <p className="text-muted-foreground">Adicione e gerencie vídeos tutoriais da plataforma</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Tutorial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTutorial ? 'Editar Tutorial' : 'Novo Tutorial'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Digite o título do tutorial"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria *</label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o conteúdo do tutorial"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL do Vídeo *</label>
                <Input
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL da Thumbnail</label>
                <Input
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://exemplo.com/thumbnail.jpg"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <label className="text-sm font-medium">Tutorial ativo</label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingTutorial ? 'Salvar Alterações' : 'Criar Tutorial'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Tutoriais */}
      <div className="grid gap-4">
        {tutorials.map((tutorial, index) => (
          <Card key={tutorial.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateOrder(tutorial.id, tutorial.order_index - 1)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateOrder(tutorial.id, tutorial.order_index + 1)}
                      disabled={index === tutorials.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {tutorial.thumbnail_url && (
                    <img
                      src={tutorial.thumbnail_url}
                      alt={tutorial.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{tutorial.title}</h3>
                      <Badge variant="outline">{getCategoryLabel(tutorial.category)}</Badge>
                      {tutorial.is_active ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Eye className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </div>
                    {tutorial.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {tutorial.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(tutorial.video_url, '_blank')}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(tutorial.id, tutorial.is_active)}
                  >
                    {tutorial.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(tutorial)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(tutorial.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tutorials.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhum tutorial encontrado. Clique em "Novo Tutorial" para começar.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};