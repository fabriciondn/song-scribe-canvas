
import { supabase } from '@/integrations/supabase/client';
import { ensureAudioBucketExists } from '../storage/storageBuckets';

// Upload audio for a draft
export const uploadAudio = async (audioBlob: Blob, filename: string): Promise<string> => {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Ensure the audio bucket exists
    await ensureAudioBucketExists();
    
    const filePath = `${userId}/${filename}`;
    
    // Upload the audio file
    const { error: uploadError, data } = await supabase.storage
      .from('audio')
      .upload(filePath, audioBlob, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) throw uploadError;
    
    // Get the public URL of the uploaded file
    const { data: urlData } = supabase.storage
      .from('audio')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
};
