
import { supabase } from '@/integrations/supabase/client';
import { nanoid } from 'nanoid';

export interface Folder {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  is_system?: boolean;
}

export interface Song {
  id: string;
  title: string;
  content: string;
  folder_id?: string;
  user_id?: string;
  created_at: string;
  updated_at?: string;
}

// Ensure default Backup folder exists
export const ensureBackupFolderExists = async (): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('No authenticated user');
      
    }
    
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('name', 'Backup')
      .eq('is_system', true)
      .eq('user_id', session.user.id);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      await createDefaultBackupFolder();
    }
  } catch (error) {
    console.error('Error ensuring backup folder exists:', error);
    // Continue even if this fails
  }
};

// Get all folders for the current user
export const getFolders = async (): Promise<Folder[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('No authenticated user');
    }
    
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Create default Backup folder if it doesn't exist
    const backupFolder = data?.find(folder => folder.name === 'Backup' && folder.is_system === true);
    if (!backupFolder) {
      await createDefaultBackupFolder();
      // Fetch again with the new folder
      const { data: updatedData, error: updatedError } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (updatedError) throw updatedError;
      return updatedData || [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

// Create default backup folder for the user
export const createDefaultBackupFolder = async (): Promise<Folder> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('No authenticated user');
    }
    
    const folderData = {
      name: 'Backup',
      user_id: session.user.id,
      is_system: true
    };
    
    const { data, error } = await supabase
      .from('folders')
      .insert(folderData)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as Folder;
  } catch (error) {
    console.error('Error creating default backup folder:', error);
    throw error;
  }
};

// Get a folder by ID
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
    console.error('Error fetching folder:', error);
    throw error;
  }
};

// Create a new folder
export const createFolder = async (name: string): Promise<Folder> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('No authenticated user');
    }
    
    const folderData = {
      name,
      user_id: session.user.id,
      is_system: false
    };
    
    const { data, error } = await supabase
      .from('folders')
      .insert(folderData)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as Folder;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

// Delete a folder
export const deleteFolder = async (folderId: string): Promise<void> => {
  try {
    // Check if this is a system folder (don't allow deletion)
    const { data: folder } = await supabase
      .from('folders')
      .select('is_system')
      .eq('id', folderId)
      .single();
    
    if (folder && folder.is_system) {
      throw new Error('Cannot delete system folders');
    }
    
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

// Get all songs in a folder
export const getSongsInFolder = async (folderId: string): Promise<Song[]> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching songs:', error);
    throw error;
  }
};

// Get a song by ID
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
    console.error('Error fetching song:', error);
    throw error;
  }
};

// Create a new song in a folder
export const createSong = async (song: { title: string; content: string; folder_id: string }): Promise<Song> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('No authenticated user');
    }
    
    const songData = {
      title: song.title,
      content: song.content,
      folder_id: song.folder_id,
      user_id: session.user.id
    };
    
    const { data, error } = await supabase
      .from('songs')
      .insert(songData)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as Song;
  } catch (error) {
    console.error('Error creating song:', error);
    throw error;
  }
};

// Update a song
export const updateSong = async (songId: string, title: string, content: string): Promise<Song> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .update({ title, content })
      .eq('id', songId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as Song;
  } catch (error) {
    console.error('Error updating song:', error);
    throw error;
  }
};

// Delete a song
export const deleteSong = async (songId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', songId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting song:', error);
    throw error;
  }
};
