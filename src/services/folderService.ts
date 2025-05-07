
import { supabase } from '@/integrations/supabase/client';

export interface Folder {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  is_system?: boolean; // Add this property to mark system folders
}

export interface Song {
  id: string;
  title: string;
  content: string;
  folder_id: string;
  created_at: string;
  updated_at?: string;
}

// Check if a backup folder exists, if not create it
export const ensureBackupFolderExists = async (): Promise<void> => {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Check if Backup folder already exists
    const { data: folders, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('name', 'Backup')
      .eq('user_id', userId);
    
    if (folderError) throw folderError;
    
    // If Backup folder doesn't exist, create it
    if (!folders || folders.length === 0) {
      const { error } = await supabase
        .from('folders')
        .insert({ 
          name: 'Backup',
          user_id: userId,
          is_system: true // Mark as system folder that shouldn't be deleted
        });
      
      if (error) throw error;
      
      console.log('Created system Backup folder');
    }
  } catch (error) {
    console.error('Error ensuring backup folder exists:', error);
  }
};

export const getFolders = async (): Promise<Folder[]> => {
  try {
    // Ensure the Backup folder exists before fetching folders
    await ensureBackupFolderExists();
    
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

export const getFolderById = async (folderId: string): Promise<Folder | null> => {
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching folder with ID ${folderId}:`, error);
    throw error;
  }
};

export const createFolder = async (name: string): Promise<Folder> => {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('folders')
      .insert({ 
        name,
        user_id: userId,
        is_system: false // Not a system folder
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

export const deleteFolder = async (id: string): Promise<void> => {
  try {
    // First check if it's a system folder
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('is_system')
      .eq('id', id)
      .single();
    
    if (folderError) throw folderError;
    
    // Prevent deletion if it's a system folder
    if (folder?.is_system) {
      throw new Error('Cannot delete a system folder');
    }

    // Delete all songs in this folder
    const { error: songsError } = await supabase
      .from('songs')
      .delete()
      .eq('folder_id', id);

    if (songsError) throw songsError;
    
    // Then delete the folder
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting folder with ID ${id}:`, error);
    throw error;
  }
};

export const getSongsByFolderId = async (folderId: string): Promise<Song[]> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching songs for folder ${folderId}:`, error);
    throw error;
  }
};

export const getSongById = async (songId: string): Promise<Song | null> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching song with ID ${songId}:`, error);
    throw error;
  }
};

export const createSong = async (song: { title: string, content: string, folder_id: string }): Promise<Song> => {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('songs')
      .insert({
        title: song.title,
        content: song.content,
        folder_id: song.folder_id,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating song:', error);
    throw error;
  }
};

export const updateSong = async (id: string, updates: { title?: string, content?: string }): Promise<Song> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating song with ID ${id}:`, error);
    throw error;
  }
};

export const deleteSong = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting song with ID ${id}:`, error);
    throw error;
  }
};
