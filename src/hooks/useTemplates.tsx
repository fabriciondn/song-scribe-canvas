
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Template, TemplateField, DEFAULT_TEMPLATE_FIELDS } from '@/types/template';

const STORAGE_KEY = 'songscribe_templates';
const ACTIVE_TEMPLATE_KEY = 'songscribe_active_template';

const INITIAL_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Template Padrão',
    location: 'Estúdio',
    city: 'São Paulo',
    notes: 'Template padrão para documentação de anterioridade.',
    selectedFields: DEFAULT_TEMPLATE_FIELDS,
    isActive: true,
    createdAt: new Date().toLocaleDateString('pt-BR'),
    createdTime: new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
  }
];

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>(() => {
    const savedTemplates = localStorage.getItem(STORAGE_KEY);
    return savedTemplates ? JSON.parse(savedTemplates) : INITIAL_TEMPLATES;
  });
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
  const [selectedFields, setSelectedFields] = useState<TemplateField[]>(DEFAULT_TEMPLATE_FIELDS);
  
  const { toast } = useToast();

  // Save templates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);
  
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
    setSelectedFields(DEFAULT_TEMPLATE_FIELDS);
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
    setSelectedFields(template.selectedFields || DEFAULT_TEMPLATE_FIELDS);
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
              duration,
              selectedFields
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
        selectedFields,
        isActive: false,
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
    // Check if the template being deleted is active
    const templateToDelete = templates.find(t => t.id === id);
    let newTemplates = templates.filter(t => t.id !== id);
    
    // If the active template is being deleted, set the first available template as active
    if (templateToDelete?.isActive && newTemplates.length > 0) {
      newTemplates = newTemplates.map((t, index) => 
        index === 0 ? { ...t, isActive: true } : t
      );
    }
    
    setTemplates(newTemplates);
    
    toast({
      title: 'Template excluído',
      description: 'O template foi excluído com sucesso.',
    });
  };

  const setActiveTemplate = (id: string) => {
    setTemplates(templates.map(template => ({
      ...template,
      isActive: template.id === id
    })));
    
    localStorage.setItem(ACTIVE_TEMPLATE_KEY, id);
    
    toast({
      title: 'Template ativado',
      description: `O template foi definido como modelo padrão para seus DAs.`,
    });
  };

  const getActiveTemplate = (): Template | undefined => {
    return templates.find(t => t.isActive);
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
    selectedFields,
    setSelectedFields,
    openNewTemplateDialog,
    openEditTemplateDialog,
    handleSaveTemplate,
    handleDeleteTemplate,
    setActiveTemplate,
    getActiveTemplate
  };
};
