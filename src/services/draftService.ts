
import { supabase } from '@/integrations/supabase/client';
import { createSystemBackup } from './backupService';

export interface Draft {
  id: string;
  title: string;
  content: string;
  audio_url?: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface DraftInput {
  title: string;
  content: string;
  audioUrl?: string;
}

export const getDrafts = async (): Promise<Draft[]> => {
  try {
    // Use RPC function
    const { data, error } = await supabase
      .rpc('get_drafts')
      .returns<Draft[]>();
    
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
      return directData as Draft[] || [];
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
      .rpc('get_draft_by_id', { draft_id: draftId })
      .returns<Draft>();
    
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
    
    // Use RPC function
    const { data, error } = await supabase
      .rpc('create_draft', { 
        draft_title: draft.title,
        draft_content: draft.content,
        draft_audio_url: draft.audioUrl || null,
        draft_user_id: userId
      })
      .returns<Draft>();
    
    if (error) {
      // Fallback to direct insert
      const { data: directData, error: directError } = await supabase
        .from('drafts')
        .insert({
          title: draft.title,
          content: draft.content,
          audio_url: draft.audioUrl,
          user_id: userId
        })
        .select()
        .single() as {
          data: Draft | null,
          error: any
        };
      
      if (directError) throw directError;
      return directData as Draft;
    }
    
    return data;
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
  }
): Promise<Draft> => {
  try {
    // Convert updates to the format expected by RPC function
    const jsonUpdates = {
      title: updates.title,
      content: updates.content,
      audio_url: updates.audioUrl
    };
    
    // Use RPC function
    const { data, error } = await supabase
      .rpc('update_draft', { 
        draft_id: draftId,
        draft_updates: jsonUpdates
      })
      .returns<Draft>();
    
    if (error) {
      // Fallback to direct update
      const updateValues: any = {};
      if (updates.title !== undefined) updateValues.title = updates.title;
      if (updates.content !== undefined) updateValues.content = updates.content;
      if (updates.audioUrl !== undefined) updateValues.audio_url = updates.audioUrl;
      
      const { data: directData, error: directError } = await supabase
        .from('drafts')
        .update(updateValues)
        .eq('id', draftId)
        .select()
        .single() as {
          data: Draft | null,
          error: any
        };
      
      if (directError) throw directError;
      return directData as Draft;
    }
    
    return data;
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

// Upload audio for a draft
export const uploadAudio = async (audioBlob: Blob, filename: string): Promise<string> => {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const filePath = `${userId}/${filename}`;
    
    // Create bucket if it doesn't exist
    await supabase.storage.createBucket('audio', {
      public: true,
    }).catch(err => {
      // Bucket might already exist, continue
      console.log('Bucket creation skipped:', err);
    });
    
    // Upload the audio file
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(filePath, audioBlob);
    
    if (uploadError) throw uploadError;
    
    // Get the public URL of the uploaded file
    const { data } = supabase.storage
      .from('audio')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
};
