
import { supabase } from '@/integrations/supabase/client';

// Ensure required buckets exist
export const ensureAudioBucketExists = async (): Promise<void> => {
  try {
    // Check if the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(bucket => bucket.name === 'audio');

    // If the bucket doesn't exist, create it
    if (!exists) {
      const { error } = await supabase.storage.createBucket('audio', {
        public: true, // Make audio files accessible
      });
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error ensuring audio bucket exists:', error);
    // Continue even if this fails
  }
};

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
