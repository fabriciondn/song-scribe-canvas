
import { supabase } from "@/integrations/supabase/client";
import { Template, TemplateField } from '@/types/template';

// Default initial template for local storage fallback
export const INITIAL_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Template Padrão',
    location: 'Estúdio',
    city: 'São Paulo',
    notes: 'Template padrão para documentação de anterioridade.',
    selectedFields: ["location", "city", "notes"],
    isActive: true,
    createdAt: new Date().toLocaleDateString('pt-BR'),
    createdTime: new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
  }
];

export const STORAGE_KEY = 'songscribe_templates';
export const ACTIVE_TEMPLATE_KEY = 'songscribe_active_template';

// Fetch all templates for the current user
export async function fetchTemplates(): Promise<Template[]> {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching templates:', error);
      // Fall back to local storage
      const savedTemplates = localStorage.getItem(STORAGE_KEY);
      return savedTemplates ? JSON.parse(savedTemplates) : INITIAL_TEMPLATES;
    }
    
    // Transform from Supabase format to our app format
    const templates = data.map(item => ({
      id: item.id,
      name: item.name,
      location: item.location || '',
      city: item.city || '',
      notes: item.notes || '',
      genre: item.genre || '',
      version: item.version || '',
      collaborators: item.collaborators || '',
      instrumentation: item.instrumentation || '',
      duration: item.duration || '',
      selectedFields: item.selected_fields || ["location", "city", "notes"],
      isActive: item.is_active || false,
      createdAt: new Date(item.created_at).toLocaleDateString('pt-BR'),
      createdTime: new Date(item.created_at).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    }));
    
    // If no templates found, return initial template
    if (templates.length === 0) {
      return INITIAL_TEMPLATES;
    }
    
    return templates;
  } catch (error) {
    console.error('Error in fetchTemplates:', error);
    // Fall back to local storage
    const savedTemplates = localStorage.getItem(STORAGE_KEY);
    return savedTemplates ? JSON.parse(savedTemplates) : INITIAL_TEMPLATES;
  }
}

// Create a new template
export async function createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'createdTime'>): Promise<Template | null> {
  try {
    // Convert to Supabase format
    const { data, error } = await supabase
      .from('templates')
      .insert({
        name: template.name,
        location: template.location,
        city: template.city,
        notes: template.notes,
        genre: template.genre,
        version: template.version,
        collaborators: template.collaborators,
        instrumentation: template.instrumentation,
        duration: template.duration,
        selected_fields: template.selectedFields,
        is_active: template.isActive,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating template:', error);
      return null;
    }
    
    // Transform to our app format
    return {
      id: data.id,
      name: data.name,
      location: data.location || '',
      city: data.city || '',
      notes: data.notes || '',
      genre: data.genre || '',
      version: data.version || '',
      collaborators: data.collaborators || '',
      instrumentation: data.instrumentation || '',
      duration: data.duration || '',
      selectedFields: data.selected_fields || ["location", "city", "notes"],
      isActive: data.is_active || false,
      createdAt: new Date(data.created_at).toLocaleDateString('pt-BR'),
      createdTime: new Date(data.created_at).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };
  } catch (error) {
    console.error('Error in createTemplate:', error);
    return null;
  }
}

// Update an existing template
export async function updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template | null> {
  try {
    // Convert to Supabase format
    const supabaseUpdates: any = {};
    if (updates.name) supabaseUpdates.name = updates.name;
    if (updates.location !== undefined) supabaseUpdates.location = updates.location;
    if (updates.city !== undefined) supabaseUpdates.city = updates.city;
    if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;
    if (updates.genre !== undefined) supabaseUpdates.genre = updates.genre;
    if (updates.version !== undefined) supabaseUpdates.version = updates.version;
    if (updates.collaborators !== undefined) supabaseUpdates.collaborators = updates.collaborators;
    if (updates.instrumentation !== undefined) supabaseUpdates.instrumentation = updates.instrumentation;
    if (updates.duration !== undefined) supabaseUpdates.duration = updates.duration;
    if (updates.selectedFields) supabaseUpdates.selected_fields = updates.selectedFields;
    if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;
    
    const { data, error } = await supabase
      .from('templates')
      .update(supabaseUpdates)
      .eq('id', templateId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating template:', error);
      return null;
    }
    
    // Transform to our app format
    return {
      id: data.id,
      name: data.name,
      location: data.location || '',
      city: data.city || '',
      notes: data.notes || '',
      genre: data.genre || '',
      version: data.version || '',
      collaborators: data.collaborators || '',
      instrumentation: data.instrumentation || '',
      duration: data.duration || '',
      selectedFields: data.selected_fields || ["location", "city", "notes"],
      isActive: data.is_active || false,
      createdAt: new Date(data.created_at).toLocaleDateString('pt-BR'),
      createdTime: new Date(data.created_at).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };
  } catch (error) {
    console.error('Error in updateTemplate:', error);
    return null;
  }
}

// Delete a template
export async function deleteTemplate(templateId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);
    
    if (error) {
      console.error('Error deleting template:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteTemplate:', error);
    return false;
  }
}

// Set a template as active and all others as inactive
export async function setActiveTemplate(templateId: string): Promise<boolean> {
  try {
    // First, set all templates to inactive
    const { error: error1 } = await supabase
      .from('templates')
      .update({ is_active: false })
      .not('id', 'eq', templateId);
    
    if (error1) {
      console.error('Error deactivating other templates:', error1);
      return false;
    }
    
    // Then set the selected template to active
    const { error: error2 } = await supabase
      .from('templates')
      .update({ is_active: true })
      .eq('id', templateId);
    
    if (error2) {
      console.error('Error activating template:', error2);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in setActiveTemplate:', error);
    return false;
  }
}
