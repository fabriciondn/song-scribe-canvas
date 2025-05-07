
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Template } from '@/types/template';
import { useTemplateState } from './useTemplateState';
import * as templateService from '@/services/templateService';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const { toast } = useToast();
  
  // Import all template state fields
  const templateState = useTemplateState();
  
  // Load templates when the component mounts
  useEffect(() => {
    loadTemplates();
  }, []);

  // Save templates to localStorage whenever they change (as a backup)
  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem(templateService.STORAGE_KEY, JSON.stringify(templates));
    }
  }, [templates]);
  
  // Load templates from Supabase
  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const fetchedTemplates = await templateService.fetchTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: 'Erro ao carregar templates',
        description: 'Não foi possível carregar seus modelos. Usando dados locais.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const openNewTemplateDialog = () => {
    templateState.resetFields();
    setEditingTemplate(null);
    setIsNewTemplateOpen(true);
  };
  
  const openEditTemplateDialog = (template: Template) => {
    templateState.initializeWithTemplate(template);
    setEditingTemplate(template);
    setIsNewTemplateOpen(true);
  };
  
  const handleSaveTemplate = async () => {
    if (!templateState.name.trim()) {
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
    
    try {
      if (editingTemplate) {
        // Update existing template
        const updatedTemplate = await templateService.updateTemplate(editingTemplate.id, {
          name: templateState.name,
          location: templateState.location,
          city: templateState.city,
          notes: templateState.notes,
          genre: templateState.genre,
          version: templateState.version,
          collaborators: templateState.collaborators,
          instrumentation: templateState.instrumentation,
          duration: templateState.duration,
          selectedFields: templateState.selectedFields
        });
        
        if (updatedTemplate) {
          setTemplates(templates.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
          
          toast({
            title: 'Template atualizado',
            description: `O template "${templateState.name}" foi atualizado com sucesso.`,
          });
        }
      } else {
        // Create new template
        const newTemplate = await templateService.createTemplate({
          name: templateState.name,
          location: templateState.location,
          city: templateState.city,
          notes: templateState.notes,
          genre: templateState.genre,
          version: templateState.version,
          collaborators: templateState.collaborators,
          instrumentation: templateState.instrumentation,
          duration: templateState.duration,
          selectedFields: templateState.selectedFields,
          isActive: false
        });
        
        if (newTemplate) {
          setTemplates([...templates, newTemplate]);
          
          toast({
            title: 'Template criado',
            description: `O template "${templateState.name}" foi criado com sucesso.`,
          });
        }
      }
      
      setIsNewTemplateOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o template. Tente novamente.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteTemplate = async (id: string) => {
    try {
      // Check if the template being deleted is active
      const templateToDelete = templates.find(t => t.id === id);
      const success = await templateService.deleteTemplate(id);
      
      if (success) {
        let newTemplates = templates.filter(t => t.id !== id);
        
        // If the active template is being deleted, set the first available template as active
        if (templateToDelete?.isActive && newTemplates.length > 0) {
          await setActiveTemplate(newTemplates[0].id);
          // Reload templates to get updated active state
          await loadTemplates();
        } else {
          setTemplates(newTemplates);
        }
        
        toast({
          title: 'Template excluído',
          description: 'O template foi excluído com sucesso.',
        });
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Ocorreu um erro ao excluir o template. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const setActiveTemplate = async (id: string) => {
    try {
      const success = await templateService.setActiveTemplate(id);
      
      if (success) {
        // Update local state
        setTemplates(templates.map(template => ({
          ...template,
          isActive: template.id === id
        })));
        
        // Also save to localStorage as backup
        localStorage.setItem(templateService.ACTIVE_TEMPLATE_KEY, id);
        
        toast({
          title: 'Template ativado',
          description: `O template foi definido como modelo padrão para seus DAs.`,
        });
      }
    } catch (error) {
      console.error('Error setting active template:', error);
      toast({
        title: 'Erro ao ativar template',
        description: 'Ocorreu um erro ao ativar o template. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const getActiveTemplate = (): Template | undefined => {
    return templates.find(t => t.isActive);
  };

  return {
    templates,
    isLoading,
    isNewTemplateOpen,
    setIsNewTemplateOpen,
    editingTemplate,
    openNewTemplateDialog,
    openEditTemplateDialog,
    handleSaveTemplate,
    handleDeleteTemplate,
    setActiveTemplate,
    getActiveTemplate,
    // Pass through all template state fields
    ...templateState
  };
};
