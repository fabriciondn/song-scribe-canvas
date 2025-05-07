
import { supabase } from '@/integrations/supabase/client';
import { ensureBackupBucketExists } from '../storage/storageBuckets';

export interface Backup {
  id: string;
  title: string;
  file_path: string;
  file_url?: string;
  created_at: string;
  user_id?: string;
  is_system?: boolean;
}

// Create a backup directly to the backup system
export const createSystemBackup = async (title: string, content: string): Promise<Backup> => {
  try {
    await ensureBackupBucketExists();
    
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
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('backups')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;

    // Save record in the system_backups table using raw insert due to type issues
    const insertData = {
      title,
      file_path: filePath,
      user_id: userId,
      is_system: true // Mark as system backup
    };

    const { data, error } = await supabase
      .from('system_backups')
      .insert(insertData)
      .select()
      .single() as { 
        data: Backup | null, 
        error: any 
      };
    
    if (error) throw error;
    
    // Get the public URL
    const { data: publicURL } = supabase.storage
      .from('backups')
      .getPublicUrl(filePath);
    
    // Add URL to the result
    const backup = data;
    if (backup) {
      backup.file_url = publicURL.publicUrl;
    }
    
    return backup as Backup;
  } catch (error) {
    console.error('Error creating system backup:', error);
    throw error;
  }
};

// Get all backups for the current user
export const getBackups = async (): Promise<Backup[]> => {
  try {
    // Use a stored procedure to get backups
    const { data, error } = await supabase
      .rpc('get_system_backups') as {
        data: Backup[] | null;
        error: any;
      };
    
    if (error) {
      // Fallback to direct query with casting to handle type issues
      const { data: directData, error: directError } = await supabase
        .from('system_backups')
        .select('*')
        .order('created_at', { ascending: false }) as { 
          data: Backup[] | null, 
          error: any 
        };
      
      if (directError) throw directError;
      
      // Add file URLs
      const backups = directData || [];
      for (const backup of backups) {
        if (backup.file_path) {
          const { data: url } = supabase.storage
            .from('backups')
            .getPublicUrl(backup.file_path);
          backup.file_url = url.publicUrl;
        }
      }
      
      return backups;
    }
    
    // Add file URLs to results
    const backups = data || [];
    for (const backup of backups) {
      if (backup.file_path) {
        const { data: url } = supabase.storage
          .from('backups')
          .getPublicUrl(backup.file_path);
        backup.file_url = url.publicUrl;
      }
    }
    
    return backups;
  } catch (error) {
    console.error('Error fetching backups:', error);
    throw error;
  }
};

// Get a specific backup by ID
export const getBackupById = async (backupId: string): Promise<Backup | null> => {
  try {
    // Use a direct query with type casting
    const { data, error } = await supabase
      .from('system_backups')
      .select('*')
      .eq('id', backupId)
      .single() as { 
        data: Backup | null, 
        error: any 
      };
    
    if (error) throw error;
    
    // Add file URL
    const backup = data;
    if (backup && backup.file_path) {
      const { data: url } = supabase.storage
        .from('backups')
        .getPublicUrl(backup.file_path);
      backup.file_url = url.publicUrl;
    }
    
    return backup;
  } catch (error) {
    console.error(`Error fetching backup with ID ${backupId}:`, error);
    throw error;
  }
};
