import { supabase } from '@/integrations/supabase/client';
import { Draft, DraftInput, AudioFile } from './types';
import { uploadAudio } from './audioService';
import { createSystemBackup } from './backupService';
import { ensureAudioBucketExists } from '../storage/storageBuckets';

export const getDrafts = async (): Promise<Draft[]> => {
  try {
    // Use RPC function
    const { data, error } = await supabase
      .rpc('get_drafts') as {
        data: Draft[] | null;
        error: any;
      };
    
    if (error) {
      // Fallback to direct query
      const { data: directData, error: directError } = await supabase
        .from('drafts')
        .select('*')
        .order('created_at', { ascending: false }) as {
          data: Draft[] | null,
          error: any
        };
      
      if (directError) throw directError;
      return directData || [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching drafts:', error);
    throw error;
  }
};

export const getDraftById = async (draftId: string): Promise<Draft | null> => {
  try {
    // Use RPC function
    const { data, error } = await supabase
      .rpc('get_draft_by_id', { draft_id: draftId }) as {
        data: Draft | null;
        error: any;
      };
    
    if (error) {
      // Fallback to direct query
      const { data: directData, error: directError } = await supabase
        .from('drafts')
        .select('*')
        .eq('id', draftId)
        .single() as {
          data: Draft | null,
          error: any
        };
      
      if (directError) throw directError;
      return directData;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching draft with ID ${draftId}:`, error);
    throw error;
  }
};

export const createDraft = async (draft: DraftInput): Promise<Draft> => {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Ensure the audio bucket exists before trying to use it
    await ensureAudioBucketExists();
    
    // Prepare data for insert
    const draftData: any = {
      title: draft.title,
      content: draft.content,
      user_id: userId
    };
    
    // Adicionar informações de áudio, se disponíveis
    if (draft.audioFiles && draft.audioFiles.length > 0) {
      draftData.audio_files = draft.audioFiles;
      // Para compatibilidade com a versão anterior, também definimos audio_url
      draftData.audio_url = draft.audioFiles[0].url;
    } else if (draft.audioUrl) {
      draftData.audio_url = draft.audioUrl;
    }
    
    // Direct insert since RPC function doesn't support the new audio_files field
    const { data: newDraft, error } = await supabase
      .from('drafts')
      .insert(draftData)
      .select()
      .single() as {
        data: Draft | null,
        error: any
      };
    
    if (error) throw error;
    return newDraft as Draft;
  } catch (error) {
    console.error('Error creating draft:', error);
    throw error;
  }
};

export const updateDraft = async (
  draftId: string,
  updates: {
    title?: string;
    content?: string;
    audioUrl?: string;
    audioFiles?: AudioFile[];
  }
): Promise<Draft> => {
  try {
    // Prepare data for update
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    
    // Atualizar informações de áudio
    if (updates.audioFiles && updates.audioFiles.length > 0) {
      updateData.audio_files = updates.audioFiles;
      // Para compatibilidade com a versão anterior, também definimos audio_url
      updateData.audio_url = updates.audioFiles[0].url;
    } else if (updates.audioUrl) {
      updateData.audio_url = updates.audioUrl;
    }
    
    // Direct update since RPC function doesn't support the new audio_files field
    const { data: updatedDraft, error } = await supabase
      .from('drafts')
      .update(updateData)
      .eq('id', draftId)
      .select()
      .single() as {
        data: Draft | null,
        error: any
      };
    
    if (error) throw error;
    return updatedDraft as Draft;
  } catch (error) {
    console.error(`Error updating draft with ID ${draftId}:`, error);
    throw error;
  }
};

export const deleteDraft = async (draftId: string): Promise<void> => {
  try {
    // Use RPC function
    const { error } = await supabase.rpc('delete_draft', { draft_id: draftId });
    
    if (error) {
      // Fallback to direct delete
      const { error: directError } = await supabase
        .from('drafts')
        .delete()
        .eq('id', draftId);
      
      if (directError) throw directError;
    }
  } catch (error) {
    console.error(`Error deleting draft with ID ${draftId}:`, error);
    throw error;
  }
};

// Create a backup directly to the backup system
export const createBackup = async (title: string, content: string): Promise<void> => {
  try {
    await createSystemBackup(title, content);
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};
