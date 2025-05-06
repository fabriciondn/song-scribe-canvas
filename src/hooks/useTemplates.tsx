
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Template } from '@/types/template';

const INITIAL_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Template Padrão',
    location: 'Estúdio',
    city: 'São Paulo',
    notes: 'Template padrão para documentação de anterioridade.',
    createdAt: new Date().toLocaleDateString('pt-BR'),
    createdTime: new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
  }
];

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [genre, setGenre] = useState('');
  const [version, setVersion] = useState('');
  const [collaborators, setCollaborators] = useState('');
  const [instrumentation, setInstrumentation] = useState('');
  const [duration, setDuration] = useState('');
  
  const { toast } = useToast();
  
  const openNewTemplateDialog = () => {
    setName('');
    setLocation('');
    setCity('');
    setNotes('');
    setGenre('');
    setVersion('');
    setCollaborators('');
    setInstrumentation('');
    setDuration('');
    setEditingTemplate(null);
    setIsNewTemplateOpen(true);
  };
  
  const openEditTemplateDialog = (template: Template) => {
    setName(template.name);
    setLocation(template.location);
    setCity(template.city);
    setNotes(template.notes || '');
    setGenre(template.genre || '');
    setVersion(template.version || '');
    setCollaborators(template.collaborators || '');
    setInstrumentation(template.instrumentation || '');
    setDuration(template.duration || '');
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
    
    const currentDate = new Date();
    const createdAt = currentDate.toLocaleDateString('pt-BR');
    const createdTime = currentDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    if (editingTemplate) {
      // Update existing template
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id 
          ? { 
              ...t, 
              name, 
              location, 
              city, 
              notes, 
              genre, 
              version, 
              collaborators, 
              instrumentation, 
              duration 
            } 
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
        genre,
        version,
        collaborators,
        instrumentation,
        duration,
        createdAt,
        createdTime
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

  return {
    templates,
    isNewTemplateOpen,
    setIsNewTemplateOpen,
    editingTemplate,
    name,
    setName,
    location,
    setLocation,
    city,
    setCity,
    notes,
    setNotes,
    genre,
    setGenre,
    version,
    setVersion,
    collaborators,
    setCollaborators,
    instrumentation,
    setInstrumentation,
    duration,
    setDuration,
    openNewTemplateDialog,
    openEditTemplateDialog,
    handleSaveTemplate,
    handleDeleteTemplate
  };
};
