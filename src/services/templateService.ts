
import { supabase } from '@/integrations/supabase/client';
import { TemplateField } from '@/types/template';
import { Json } from '@/integrations/supabase/types';

// Constants for localStorage keys
export const STORAGE_KEY = 'saved_templates';
export const ACTIVE_TEMPLATE_KEY = 'active_template_id';

export interface Template {
  id: string;
  name: string;
  location: string;
  city: string;
  notes: string;
  genre: string;
  version: string;
  collaborators: string;
  instrumentation: string;
  duration: string;
  selectedFields: TemplateField[];
  isActive: boolean;
  createdAt: string;
  createdTime: string;
}

export const fetchTemplates = async (): Promise<Template[]> => {
  try {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .is('deleted_at', null) // Exclude deleted templates
    .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    if (!data) return [];

    return data.map((template) => ({
      id: template.id,
      name: template.name,
      location: template.location || '',
      city: template.city || '',
      notes: template.notes || '',
      genre: template.genre || '',
      version: template.version || '',
      collaborators: template.collaborators || '',
      instrumentation: template.instrumentation || '',
      duration: template.duration || '',
      selectedFields: template.selected_fields as TemplateField[] || [],
      isActive: template.is_active || false,
      createdAt: template.created_at || new Date().toISOString(),
      createdTime: new Date(template.created_at || new Date()).toLocaleTimeString(),
    }));
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

export const getAllTemplates = async (): Promise<Template[]> => {
  return fetchTemplates();
};

export const getTemplateById = async (templateId: string): Promise<Template | null> => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw new Error(error.message);
    if (!data) return null;

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
      selectedFields: data.selected_fields as TemplateField[] || [],
      isActive: data.is_active || false,
      createdAt: data.created_at || new Date().toISOString(),
      createdTime: new Date(data.created_at || new Date()).toLocaleTimeString(),
    };
  } catch (error) {
    console.error('Error fetching template by ID:', error);
    throw error;
  }
};

export const createTemplate = async (template: {
  name: string;
  location: string;
  city: string;
  notes: string;
  genre: string;
  version: string;
  collaborators: string;
  instrumentation: string;
  duration: string;
  selectedFields: TemplateField[];
}): Promise<Template> => {
  try {
    // First, get the user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Then create the template
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
        user_id: userId
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Failed to create template');

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
      selectedFields: data.selected_fields as TemplateField[] || [],
      isActive: data.is_active || false,
      createdAt: data.created_at || new Date().toISOString(),
      createdTime: new Date(data.created_at || new Date()).toLocaleTimeString(),
    };
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

export const updateTemplate = async (
  templateId: string,
  template: {
    name: string;
    location: string;
    city: string;
    notes: string;
    genre: string;
    version: string;
    collaborators: string;
    instrumentation: string;
    duration: string;
    selectedFields: TemplateField[];
  }
): Promise<Template> => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Failed to update template');

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
      selectedFields: data.selected_fields as TemplateField[] || [],
      isActive: data.is_active || false,
      createdAt: data.created_at || new Date().toISOString(),
      createdTime: new Date(data.created_at || new Date()).toLocaleTimeString(),
    };
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

export const deleteTemplate = async (templateId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('templates')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', templateId);

    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};

export const setActiveTemplate = async (templateId: string): Promise<boolean> => {
  try {
    // First, unset active state for all templates
    await supabase
      .from('templates')
      .update({ is_active: false })
      .not('id', 'eq', templateId);

    // Then set active state for the selected template
    const { error } = await supabase
      .from('templates')
      .update({ is_active: true })
      .eq('id', templateId);

    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    console.error('Error setting active template:', error);
    throw error;
  }
};
