
import { supabase } from '@/integrations/supabase/client';

export interface Draft {
  id: string;
  title: string;
  content: string;
  audio_url?: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

// Create a storage bucket name for audio recordings
const AUDIO_BUCKET = 'audio-recordings';

// Initialize the storage bucket if it doesn't exist yet
export const ensureAudioBucketExists = async (): Promise<void> => {
  try {
    // Check if the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(bucket => bucket.name === AUDIO_BUCKET);

    // If the bucket doesn't exist, create it
    if (!exists) {
      const { error } = await supabase.storage.createBucket(AUDIO_BUCKET, {
        public: false, // Keep drafts private
      });
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error ensuring audio bucket exists:', error);
    // We'll continue even if this fails
  }
};

// Get all drafts for the current user
export const getDrafts = async (): Promise<Draft[]> => {
  try {
    // Use a raw query instead of the typed from()
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Manually cast the response to Draft[] since TypeScript doesn't recognize the drafts table
    return (data || []) as Draft[];
  } catch (error) {
    console.error('Error fetching drafts:', error);
    throw error;
  }
};

// Get a specific draft by ID
export const getDraftById = async (draftId: string): Promise<Draft | null> => {
  try {
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', draftId)
      .single();
    
    if (error) throw error;
    return data as Draft;
  } catch (error) {
    console.error(`Error fetching draft with ID ${draftId}:`, error);
    throw error;
  }
};

// Upload an audio recording to Supabase Storage
export const uploadAudio = async (audioBlob: Blob, filename: string): Promise<string> => {
  try {
    await ensureAudioBucketExists();
    
    // Get user ID to create a user-specific path
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Create a unique filename
    const uniqueFilename = `${userId}/${Date.now()}_${filename}`;
    
    // Upload the audio file
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(uniqueFilename, audioBlob);
    
    if (error) throw error;
    
    // Get the public URL
    const { data: publicURL } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(uniqueFilename);
    
    return publicURL.publicUrl;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
};

// Create a new draft with optional audio
export const createDraft = async (
  draft: { title: string, content: string, audioUrl?: string }
): Promise<Draft> => {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('drafts')
      .insert({
        title: draft.title,
        content: draft.content,
        audio_url: draft.audioUrl,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Draft;
  } catch (error) {
    console.error('Error creating draft:', error);
    throw error;
  }
};

// Update an existing draft
export const updateDraft = async (
  id: string, 
  updates: { title?: string, content?: string, audioUrl?: string }
): Promise<Draft> => {
  try {
    const { data, error } = await supabase
      .from('drafts')
      .update({
        ...(updates.title && { title: updates.title }),
        ...(updates.content && { content: updates.content }),
        ...(updates.audioUrl && { audio_url: updates.audioUrl }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Draft;
  } catch (error) {
    console.error(`Error updating draft with ID ${id}:`, error);
    throw error;
  }
};

// Delete a draft
export const deleteDraft = async (id: string): Promise<void> => {
  try {
    // First get the draft to check if it has an audio file
    const draft = await getDraftById(id);
    
    // Delete the draft from the database
    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // If there's an audio file, delete it from storage
    if (draft?.audio_url) {
      // Extract the path from the URL
      const audioUrl = draft.audio_url;
      const pathMatch = audioUrl.match(/\/storage\/v1\/object\/public\/audio-recordings\/(.+)/);
      
      if (pathMatch && pathMatch[1]) {
        const filePath = decodeURIComponent(pathMatch[1]);
        await supabase.storage.from(AUDIO_BUCKET).remove([filePath]);
      }
    }
  } catch (error) {
    console.error(`Error deleting draft with ID ${id}:`, error);
    throw error;
  }
};
