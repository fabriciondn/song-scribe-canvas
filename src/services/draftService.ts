
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
    // Use the raw REST API approach to bypass TypeScript issues
    const { data, error } = await supabase
      .rpc('get_drafts')
      .returns<Draft[]>();
    
    if (error) {
      // Fallback to direct query if RPC fails
      const { data: directData, error: directError } = await supabase
        .from('drafts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (directError) throw directError;
      return directData as Draft[] || [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching drafts:', error);
    throw error;
  }
};

// Get a specific draft by ID
export const getDraftById = async (draftId: string): Promise<Draft | null> => {
  try {
    // Use the raw REST API approach
    const { data, error } = await supabase
      .rpc('get_draft_by_id', { draft_id: draftId })
      .returns<Draft | null>();
    
    if (error) {
      // Fallback to direct query if RPC fails
      const { data: directData, error: directError } = await supabase
        .from('drafts')
        .select('*')
        .eq('id', draftId)
        .single();
      
      if (directError) throw directError;
      return directData as Draft | null;
    }
    
    return data;
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

    // Use direct API call to bypass type checking
    const { data, error } = await supabase.rpc('create_draft', {
      draft_title: draft.title,
      draft_content: draft.content,
      draft_audio_url: draft.audioUrl || null,
      draft_user_id: userId
    }).returns<Draft>();
    
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
        .single();
      
      if (directError) throw directError;
      return directData as Draft;
    }
    
    return data;
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
    const updatePayload: Record<string, any> = {};
    if (updates.title) updatePayload.title = updates.title;
    if (updates.content) updatePayload.content = updates.content;
    if (updates.audioUrl) updatePayload.audio_url = updates.audioUrl;
    updatePayload.updated_at = new Date().toISOString();
    
    // Use raw REST API approach
    const { data, error } = await supabase.rpc('update_draft', {
      draft_id: id,
      draft_updates: updatePayload
    }).returns<Draft>();
    
    if (error) {
      // Fallback to direct update
      const { data: directData, error: directError } = await supabase
        .from('drafts')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      
      if (directError) throw directError;
      return directData as Draft;
    }
    
    return data;
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
    const { error } = await supabase.rpc('delete_draft', { draft_id: id });
    
    if (error) {
      // Fallback to direct delete
      const { error: directError } = await supabase
        .from('drafts')
        .delete()
        .eq('id', id);
      
      if (directError) throw directError;
    }
    
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

// Create a backup of a composition
export const createBackup = async (title: string, content: string): Promise<string> => {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Create a text file
    const fileName = `${Date.now()}_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    const filePath = `${userId}/${fileName}`;
    const file = new Blob([content], { type: 'text/plain' });

    // Upload the file to 'backups' bucket
    await ensureBackupBucketExists();
    const { data, error } = await supabase.storage
      .from('backups')
      .upload(filePath, file);
    
    if (error) throw error;

    // Save record in the system_backups table
    await supabase.from('system_backups').insert({
      title,
      file_path: filePath,
      user_id: userId
    });
    
    // Get the public URL
    const { data: publicURL } = supabase.storage
      .from('backups')
      .getPublicUrl(filePath);
    
    return publicURL.publicUrl;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

// Initialize the backup bucket if it doesn't exist yet
export const ensureBackupBucketExists = async (): Promise<void> => {
  try {
    // Check if the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(bucket => bucket.name === 'backups');

    // If the bucket doesn't exist, create it
    if (!exists) {
      const { error } = await supabase.storage.createBucket('backups', {
        public: true, // Make backups accessible
      });
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error ensuring backup bucket exists:', error);
    // We'll continue even if this fails
  }
};
