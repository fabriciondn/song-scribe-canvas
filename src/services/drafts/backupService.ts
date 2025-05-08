
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

// Get all backups for the current user
export const getBackups = async (): Promise<Backup[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('No authenticated user');
    }
    
    const { data, error } = await supabase
      .from('system_backups')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data as Backup[];
  } catch (error) {
    console.error('Error fetching backups:', error);
    throw error;
  }
};

// Get a backup by ID
export const getBackupById = async (backupId: string): Promise<Backup | null> => {
  try {
    const { data, error } = await supabase
      .from('system_backups')
      .select('*')
      .eq('id', backupId)
      .single();
    
    if (error) throw error;
    
    return data as Backup;
  } catch (error) {
    console.error('Error fetching backup:', error);
    throw error;
  }
};

// Create a new backup from a system-generated event
export const createSystemBackup = async (title: string, filePath: string): Promise<Backup> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('No authenticated user');
    }
    
    const backupData = {
      title,
      file_path: filePath,
      user_id: session.user.id,
      is_system: true
    };
    
    const { data, error } = await supabase
      .from('system_backups')
      .insert(backupData)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as Backup;
  } catch (error) {
    console.error('Error creating system backup:', error);
    throw error;
  }
};
