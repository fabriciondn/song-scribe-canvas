
import { supabase } from '@/integrations/supabase/client';
import { ensureAudioBucketExists } from '../storage/storageBuckets';
import { AudioFile } from './types';

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
    const { error: uploadError } = await supabase.storage
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

// Delete audio file from storage
export const deleteAudio = async (url: string): Promise<void> => {
  try {
    // Extract path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // The path should be something like /storage/v1/object/public/audio/userId/filename
    // We want to extract userId/filename
    const filePath = pathParts.slice(-2).join('/');
    
    if (!filePath) {
      throw new Error('Invalid audio URL format');
    }
    
    const { error } = await supabase.storage
      .from('audio')
      .remove([filePath]);
    
    if (error) throw error;
    
  } catch (error) {
    console.error('Error deleting audio file:', error);
    throw error;
  }
};

// Helper function to generate a unique ID for audio files
export const generateAudioId = (): string => {
  return `audio_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

// Prepare audio files array for storage
export const prepareAudioFilesForStorage = (
  audioFiles: AudioFile[],
  newAudio?: {url: string, name: string}
): AudioFile[] => {
  // Remove temporary URLs (blob:) that haven't been uploaded yet
  const validFiles = audioFiles.filter(file => 
    !file.url.startsWith('blob:') || file.url === newAudio?.url);
  
  // Add new audio if provided
  if (newAudio && !validFiles.some(file => file.url === newAudio.url)) {
    validFiles.push({
      id: generateAudioId(),
      name: newAudio.name,
      url: newAudio.url,
      created_at: new Date().toISOString()
    });
  }
  
  return validFiles;
};
