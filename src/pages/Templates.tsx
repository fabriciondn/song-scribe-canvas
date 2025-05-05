
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FileText, Trash2, Edit } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

interface Template {
  id: string;
  name: string;
  location: string;
  city: string;
  notes: string;
}

const INITIAL_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Template Padrão',
    location: 'Estúdio',
    city: 'São Paulo',
    notes: 'Template padrão para documentação de anterioridade.',
  }
];

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  
  const { toast } = useToast();
  
  const openNewTemplateDialog = () => {
    setName('');
    setLocation('');
    setCity('');
    setNotes('');
    setEditingTemplate(null);
    setIsNewTemplateOpen(true);
  };
  
  const openEditTemplateDialog = (template: Template) => {
    setName(template.name);
    setLocation(template.location);
    setCity(template.city);
    setNotes(template.notes);
    setEditingTemplate(template);
    setIsNewTemplateOpen(true);
  };
  
  const handleSaveTemplate = () => {
    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, insira um nome para o template.',
        variant: 'destructive',
      });
      return;
    }
    
    if (editingTemplate) {
      // Update existing template
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, name, location, city, notes } 
          : t
      ));
      
      toast({
        title: 'Template atualizado',
        description: `O template "${name}" foi atualizado com sucesso.`,
      });
    } else {
      // Create new template
      const newTemplate = {
        id: Date.now().toString(),
        name,
        location,
        city,
        notes,
      };
      
      setTemplates([...templates, newTemplate]);
      
      toast({
        title: 'Template criado',
        description: `O template "${name}" foi criado com sucesso.`,
      });
    }
    
    setIsNewTemplateOpen(false);
  };
  
  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    
    toast({
      title: 'Template excluído',
      description: 'O template foi excluído com sucesso.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Modelos de DA</h2>
        <Button onClick={openNewTemplateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Modelo
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map(template => (
          <Card key={template.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-primary mr-2" />
                  <CardTitle>{template.name}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => openEditTemplateDialog(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <CardDescription>Modelo para documento de anterioridade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <span className="font-medium min-w-[80px]">Local:</span>
                  <span>{template.location}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium min-w-[80px]">Cidade:</span>
                  <span>{template.city}</span>
                </div>
                {template.notes && (
                  <div className="flex items-start">
                    <span className="font-medium min-w-[80px]">Notas:</span>
                    <span className="text-muted-foreground">{template.notes}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Usar este modelo
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* New/Edit Template Dialog */}
      <Dialog open={isNewTemplateOpen} onOpenChange={setIsNewTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Modelo' : 'Novo Modelo de DA'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate 
                ? 'Edite as informações do modelo de documento de anterioridade.' 
                : 'Crie um novo modelo para seus documentos de anterioridade.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Modelo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Modelo Padrão"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Estúdio, Residência"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: São Paulo"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTemplateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? 'Salvar Alterações' : 'Criar Modelo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;
