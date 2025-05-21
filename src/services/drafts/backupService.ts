
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

// Create a new backup from a system-generated event - NOW A NO-OP FUNCTION
export const createSystemBackup = async (title: string, content: string): Promise<Backup> => {
  // Return a mock backup object without creating anything in the database
  console.log('System backup creation skipped (feature disabled)');
  return {
    id: 'no-op-backup',
    title: title,
    file_path: '',
    created_at: new Date().toISOString(),
    is_system: true
  };
};
