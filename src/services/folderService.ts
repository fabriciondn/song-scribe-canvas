
import { supabase } from '@/integrations/supabase/client';

export interface Folder {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Song {
  id: string;
  title: string;
  content: string;
  folder_id: string;
  created_at: string;
  updated_at?: string;
}

export const getFolders = async (): Promise<Folder[]> => {
  try {
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
    const { data, error } = await supabase
      .from('folders')
      .insert({ name })
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
    const { data, error } = await supabase
      .from('songs')
      .insert({
        title: song.title,
        content: song.content,
        folder_id: song.folder_id
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
