import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Upload, ExternalLink } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  button_text: string;
  redirect_url: string;
  position: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

const positions = [
  { value: 'home', label: 'Página Inicial' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'composer', label: 'Compositor' },
  { value: 'sidebar', label: 'Barra Lateral' },
];

export const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    button_text: '',
    redirect_url: '',
    position: 'home',
    is_active: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('position')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Erro ao buscar banners:', error);
      toast.error('Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success('Imagem carregada com sucesso');
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.image_url) {
      toast.error('Preencha pelo menos o título e a imagem');
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        order_index: editingBanner?.order_index ?? banners.filter(b => b.position === formData.position).length,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(dataToSubmit)
          .eq('id', editingBanner.id);

        if (error) throw error;
        toast.success('Banner atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('banners')
          .insert([dataToSubmit]);

        if (error) throw error;
        toast.success('Banner criado com sucesso');
      }

      setDialogOpen(false);
      resetForm();
      fetchBanners();
    } catch (error) {
      console.error('Erro ao salvar banner:', error);
      toast.error('Erro ao salvar banner');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      button_text: '',
      redirect_url: '',
      position: 'home',
      is_active: true,
    });
    setEditingBanner(null);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      button_text: banner.button_text,
      redirect_url: banner.redirect_url,
      position: banner.position,
      is_active: banner.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) return;

    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Banner excluído com sucesso');
      fetchBanners();
    } catch (error) {
      console.error('Erro ao excluir banner:', error);
      toast.error('Erro ao excluir banner');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Banner ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`);
      fetchBanners();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do banner');
    }
  };

  const updateOrder = async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ order_index: newOrder })
        .eq('id', id);

      if (error) throw error;
      fetchBanners();
    } catch (error) {
      console.error('Erro ao reordenar:', error);
      toast.error('Erro ao reordenar banner');
    }
  };

  const getPositionLabel = (position: string) => {
    return positions.find(p => p.value === position)?.label || position;
  };

  const groupedBanners = banners.reduce((acc, banner) => {
    if (!acc[banner.position]) {
      acc[banner.position] = [];
    }
    acc[banner.position].push(banner);
    return acc;
  }, {} as Record<string, Banner[]>);

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
          <h2 className="text-2xl font-bold">Gerenciar Banners</h2>
          <p className="text-muted-foreground">Configure banners promocionais e informativos</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'Editar Banner' : 'Novo Banner'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Digite o título do banner"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Posição</label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a posição" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.value} value={position.value}>
                          {position.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Imagem do Banner *</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="URL da imagem ou faça upload"
                    className="flex-1"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingImage}
                    />
                    <Button type="button" variant="outline" disabled={uploadingImage}>
                      {uploadingImage ? 'Carregando...' : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded border"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Texto do Botão</label>
                  <Input
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    placeholder="Ex: Saiba Mais, Acesse Agora"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL de Redirecionamento</label>
                  <Input
                    value={formData.redirect_url}
                    onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                    placeholder="https://exemplo.com"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <label className="text-sm font-medium">Banner ativo</label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingBanner ? 'Salvar Alterações' : 'Criar Banner'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Banners por Posição */}
      {Object.entries(groupedBanners).map(([position, positionBanners]) => (
        <Card key={position}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">{getPositionLabel(position)}</Badge>
              <span className="text-sm text-muted-foreground">
                ({positionBanners.length} banner{positionBanners.length !== 1 ? 's' : ''})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {positionBanners.map((banner, index) => (
              <div key={banner.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex flex-col space-y-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateOrder(banner.id, banner.order_index - 1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateOrder(banner.id, banner.order_index + 1)}
                    disabled={index === positionBanners.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-32 h-20 object-cover rounded"
                />

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{banner.title}</h3>
                    {banner.is_active ? (
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
                  {banner.button_text && (
                    <p className="text-sm text-muted-foreground">
                      Botão: {banner.button_text}
                    </p>
                  )}
                  {banner.redirect_url && (
                    <p className="text-sm text-muted-foreground">
                      Redireciona para: {banner.redirect_url}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {banner.redirect_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(banner.redirect_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(banner.id, banner.is_active)}
                  >
                    {banner.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(banner)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(banner.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {banners.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhum banner encontrado. Clique em "Novo Banner" para começar.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};