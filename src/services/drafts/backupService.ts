
import { supabase } from '@/integrations/supabase/client';

export interface Backup {
  id: string;
  title: string;
  file_url?: string;
  file_path: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  is_system?: boolean;
}

// Get all backups for the current user by using the 'songs' table with is_system flag
export const getBackups = async (): Promise<Backup[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('No authenticated user');
    }
    
    // We'll use the songs table and store backups there with a special system folder
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Convert songs to the Backup interface format
    return (data || []).map(song => ({
      id: song.id,
      title: song.title,
      file_path: song.content,  // Store content in file_path field of our interface
      created_at: song.created_at,
      updated_at: song.updated_at,
      user_id: song.user_id,
      is_system: true
    })) as Backup[];
  } catch (error) {
    console.error('Error fetching backups:', error);
    throw error;
  }
};

// Get a backup by ID
export const getBackupById = async (backupId: string): Promise<Backup | null> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', backupId)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    // Convert to Backup interface
    return {
      id: data.id,
      title: data.title,
      file_path: data.content,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_id: data.user_id,
      is_system: true
    };
  } catch (error) {
    console.error('Error fetching backup:', error);
    throw error;
  }
};

// Create a new backup from a system-generated event
export const createSystemBackup = async (title: string, content: string): Promise<Backup> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    // First, find the system backup folder or create one if it doesn't exist
    const { data: folderData } = await supabase
      .from('folders')
      .select('*')
      .eq('name', 'System Backups')
      .eq('user_id', session.user.id)
      .single();
    
    let folderId = folderData?.id;

    // Create system backup folder if it doesn't exist
    if (!folderId) {
      const { data: newFolder, error: folderError } = await supabase
        .from('folders')
        .insert({
          name: 'System Backups',
          user_id: session.user.id,
          is_system: true
        })
        .select()
        .single();
        
      if (folderError) throw folderError;
      folderId = newFolder.id;
    }
    
    // Insert the backup as a song in the songs table
    const backupData = {
      title,
      content,  // This is the file_path in our Backup interface
      user_id: session.user.id,
      folder_id: folderId
    };
    
    const { data, error } = await supabase
      .from('songs')
      .insert(backupData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Convert to Backup interface
    return {
      id: data.id,
      title: data.title,
      file_path: data.content,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_id: data.user_id,
      is_system: true
    };
  } catch (error) {
    console.error('Error creating system backup:', error);
    throw error;
  }
};
