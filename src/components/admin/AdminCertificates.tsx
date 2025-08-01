import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Eye, EyeOff, Palette, Download } from 'lucide-react';

interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  design_data: any;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export const AdminCertificates: React.FC = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [designDialogOpen, setDesignDialogOpen] = useState(false);
  const [currentDesign, setCurrentDesign] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    is_default: false,
  });

  // Configurações padrão do certificado
  const defaultDesign = {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    title: {
      text: 'CERTIFICADO DE REGISTRO',
      fontSize: 24,
      fontFamily: 'serif',
      color: '#000000',
      x: 50,
      y: 100,
    },
    subtitle: {
      text: 'Certificamos que a obra musical',
      fontSize: 16,
      fontFamily: 'sans-serif',
      color: '#333333',
      x: 50,
      y: 150,
    },
    songTitle: {
      fontSize: 20,
      fontFamily: 'serif',
      color: '#000000',
      x: 50,
      y: 200,
      bold: true,
    },
    authorLabel: {
      text: 'de autoria de:',
      fontSize: 14,
      fontFamily: 'sans-serif',
      color: '#666666',
      x: 50,
      y: 250,
    },
    authorName: {
      fontSize: 18,
      fontFamily: 'serif',
      color: '#000000',
      x: 50,
      y: 280,
    },
    registrationInfo: {
      text: 'foi registrada em nosso sistema em',
      fontSize: 12,
      fontFamily: 'sans-serif',
      color: '#666666',
      x: 50,
      y: 330,
    },
    date: {
      fontSize: 14,
      fontFamily: 'sans-serif',
      color: '#000000',
      x: 50,
      y: 350,
    },
    hash: {
      fontSize: 10,
      fontFamily: 'monospace',
      color: '#999999',
      x: 50,
      y: 400,
    },
    logo: {
      url: '/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png',
      width: 100,
      height: 50,
      x: 450,
      y: 50,
    },
    signature: {
      text: 'Compuse - Plataforma de Composição Musical',
      fontSize: 12,
      fontFamily: 'sans-serif',
      color: '#666666',
      x: 350,
      y: 450,
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      toast.error('Erro ao carregar templates de certificado');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Preencha o nome do template');
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        design_data: currentDesign || defaultDesign,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('certificate_templates')
          .update(dataToSubmit)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('certificate_templates')
          .insert([dataToSubmit]);

        if (error) throw error;
        toast.success('Template criado com sucesso');
      }

      setDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
      is_default: false,
    });
    setEditingTemplate(null);
    setCurrentDesign(null);
  };

  const handleEdit = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      is_active: template.is_active,
      is_default: template.is_default,
    });
    setCurrentDesign(template.design_data);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const { error } = await supabase
        .from('certificate_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template excluído com sucesso');
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('certificate_templates')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Template ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`);
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do template');
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      // Primeiro, remover o padrão de todos os outros templates
      await supabase
        .from('certificate_templates')
        .update({ is_default: false });

      // Depois, definir este como padrão
      const { error } = await supabase
        .from('certificate_templates')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      toast.success('Template definido como padrão');
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao definir como padrão:', error);
      toast.error('Erro ao definir template como padrão');
    }
  };

  const openDesignEditor = (template?: CertificateTemplate) => {
    setCurrentDesign(template?.design_data || defaultDesign);
    setDesignDialogOpen(true);
  };

  const updateDesignProperty = (section: string, property: string, value: any) => {
    setCurrentDesign((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [property]: value,
      }
    }));
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
          <h2 className="text-2xl font-bold">Gerenciar Certificados</h2>
          <p className="text-muted-foreground">Configure templates para certificados de registro</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Template *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Template Padrão, Template Elegante"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva este template de certificado"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <label className="text-sm font-medium">Template ativo</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <label className="text-sm font-medium">Template padrão</label>
                </div>
              </div>

              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openDesignEditor(editingTemplate)}
                  className="w-full"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Editar Design do Certificado
                </Button>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingTemplate ? 'Salvar Alterações' : 'Criar Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Editor de Design */}
      <Dialog open={designDialogOpen} onOpenChange={setDesignDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editor Visual do Certificado</DialogTitle>
          </DialogHeader>
          
          {currentDesign && (
            <div className="grid grid-cols-2 gap-6">
              {/* Preview */}
              <div className="space-y-4">
                <h3 className="font-semibold">Preview</h3>
                <div 
                  className="border-2 p-8 bg-white relative"
                  style={{
                    backgroundColor: currentDesign.backgroundColor,
                    borderColor: currentDesign.borderColor,
                    borderWidth: currentDesign.borderWidth,
                    width: '500px',
                    height: '400px',
                    fontSize: '12px',
                    position: 'relative'
                  }}
                >
                  {/* Título */}
                  <div
                    style={{
                      position: 'absolute',
                      left: currentDesign.title.x,
                      top: currentDesign.title.y,
                      fontSize: currentDesign.title.fontSize,
                      fontFamily: currentDesign.title.fontFamily,
                      color: currentDesign.title.color,
                      fontWeight: 'bold'
                    }}
                  >
                    {currentDesign.title.text}
                  </div>

                  {/* Subtítulo */}
                  <div
                    style={{
                      position: 'absolute',
                      left: currentDesign.subtitle.x,
                      top: currentDesign.subtitle.y,
                      fontSize: currentDesign.subtitle.fontSize,
                      fontFamily: currentDesign.subtitle.fontFamily,
                      color: currentDesign.subtitle.color,
                    }}
                  >
                    {currentDesign.subtitle.text}
                  </div>

                  {/* Nome da música (exemplo) */}
                  <div
                    style={{
                      position: 'absolute',
                      left: currentDesign.songTitle.x,
                      top: currentDesign.songTitle.y,
                      fontSize: currentDesign.songTitle.fontSize,
                      fontFamily: currentDesign.songTitle.fontFamily,
                      color: currentDesign.songTitle.color,
                      fontWeight: currentDesign.songTitle.bold ? 'bold' : 'normal'
                    }}
                  >
                    "[Nome da Música]"
                  </div>

                  {/* Label do autor */}
                  <div
                    style={{
                      position: 'absolute',
                      left: currentDesign.authorLabel.x,
                      top: currentDesign.authorLabel.y,
                      fontSize: currentDesign.authorLabel.fontSize,
                      fontFamily: currentDesign.authorLabel.fontFamily,
                      color: currentDesign.authorLabel.color,
                    }}
                  >
                    {currentDesign.authorLabel.text}
                  </div>

                  {/* Nome do autor (exemplo) */}
                  <div
                    style={{
                      position: 'absolute',
                      left: currentDesign.authorName.x,
                      top: currentDesign.authorName.y,
                      fontSize: currentDesign.authorName.fontSize,
                      fontFamily: currentDesign.authorName.fontFamily,
                      color: currentDesign.authorName.color,
                    }}
                  >
                    [Nome do Autor]
                  </div>

                  {/* Logo */}
                  {currentDesign.logo.url && (
                    <img
                      src={currentDesign.logo.url}
                      alt="Logo"
                      style={{
                        position: 'absolute',
                        left: currentDesign.logo.x,
                        top: currentDesign.logo.y,
                        width: currentDesign.logo.width,
                        height: currentDesign.logo.height,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Controles */}
              <div className="space-y-6">
                <h3 className="font-semibold">Configurações</h3>
                
                {/* Configurações gerais */}
                <div className="space-y-4">
                  <h4 className="font-medium">Geral</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs">Cor de Fundo</label>
                      <Input
                        type="color"
                        value={currentDesign.backgroundColor}
                        onChange={(e) => setCurrentDesign({...currentDesign, backgroundColor: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-xs">Cor da Borda</label>
                      <Input
                        type="color"
                        value={currentDesign.borderColor}
                        onChange={(e) => setCurrentDesign({...currentDesign, borderColor: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Título */}
                <div className="space-y-2">
                  <h4 className="font-medium">Título</h4>
                  <Input
                    placeholder="Texto do título"
                    value={currentDesign.title.text}
                    onChange={(e) => updateDesignProperty('title', 'text', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Tamanho da fonte"
                      value={currentDesign.title.fontSize}
                      onChange={(e) => updateDesignProperty('title', 'fontSize', parseInt(e.target.value))}
                    />
                    <Input
                      type="color"
                      value={currentDesign.title.color}
                      onChange={(e) => updateDesignProperty('title', 'color', e.target.value)}
                    />
                  </div>
                </div>

                {/* Subtítulo */}
                <div className="space-y-2">
                  <h4 className="font-medium">Subtítulo</h4>
                  <Input
                    placeholder="Texto do subtítulo"
                    value={currentDesign.subtitle.text}
                    onChange={(e) => updateDesignProperty('subtitle', 'text', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Tamanho da fonte"
                      value={currentDesign.subtitle.fontSize}
                      onChange={(e) => updateDesignProperty('subtitle', 'fontSize', parseInt(e.target.value))}
                    />
                    <Input
                      type="color"
                      value={currentDesign.subtitle.color}
                      onChange={(e) => updateDesignProperty('subtitle', 'color', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDesignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setDesignDialogOpen(false)}>
              Aplicar Design
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lista de Templates */}
      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{template.name}</h3>
                    {template.is_default && (
                      <Badge className="bg-blue-100 text-blue-800">Padrão</Badge>
                    )}
                    {template.is_active ? (
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
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDesignEditor(template)}
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(template.id, template.is_active)}
                  >
                    {template.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>

                  {!template.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAsDefault(template.id)}
                    >
                      Definir Padrão
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
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

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhum template encontrado. Clique em "Novo Template" para começar.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};