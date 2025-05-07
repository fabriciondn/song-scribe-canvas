
import { supabase } from '@/integrations/supabase/client';
import { TemplateField } from '@/types/template';

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

export const getAllTemplates = async (): Promise<Template[]> => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
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
        user_id: supabase.auth.getSession().then((result) => result?.data?.session?.user?.id)
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

export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);

    if (error) throw new Error(error.message);
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};
