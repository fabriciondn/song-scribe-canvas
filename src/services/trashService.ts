import { supabase } from '@/integrations/supabase/client';

export interface TrashItem {
  id: string;
  title: string;
  type: 'song' | 'draft' | 'folder' | 'template' | 'music_base';
  deleted_at: string;
  deleted_by: string;
  folder_id?: string;
  content?: string;
  original_data: any;
}

// Soft delete functions for each type
export const softDeleteSong = async (songId: string): Promise<void> => {
  const { error } = await supabase
    .from('songs')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', songId);

  if (error) throw error;
};

export const softDeleteDraft = async (draftId: string): Promise<void> => {
  const { error } = await supabase
    .from('drafts')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', draftId);

  if (error) throw error;
};

export const softDeleteFolder = async (folderId: string): Promise<void> => {
  const { error } = await supabase
    .from('folders')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', folderId);

  if (error) throw error;
};

export const softDeleteTemplate = async (templateId: string): Promise<void> => {
  const { error } = await supabase
    .from('templates')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', templateId);

  if (error) throw error;
};

export const softDeleteMusicBase = async (musicBaseId: string): Promise<void> => {
  const { error } = await supabase
    .from('music_bases')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', musicBaseId);

  if (error) throw error;
};

// Get all items in trash
export const getTrashItems = async (): Promise<TrashItem[]> => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('User not authenticated');

  const trashItems: TrashItem[] = [];

  // Get deleted songs
  const { data: songs } = await supabase
    .from('songs')
    .select('*')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (songs) {
    trashItems.push(...songs.map(song => ({
      id: song.id,
      title: song.title,
      type: 'song' as const,
      deleted_at: song.deleted_at!,
      deleted_by: song.deleted_by!,
      folder_id: song.folder_id,
      content: song.content,
      original_data: song
    })));
  }

  // Get deleted drafts
  const { data: drafts } = await supabase
    .from('drafts')
    .select('*')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (drafts) {
    trashItems.push(...drafts.map(draft => ({
      id: draft.id,
      title: draft.title,
      type: 'draft' as const,
      deleted_at: draft.deleted_at!,
      deleted_by: draft.deleted_by!,
      content: draft.content,
      original_data: draft
    })));
  }

  // Get deleted folders
  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (folders) {
    trashItems.push(...folders.map(folder => ({
      id: folder.id,
      title: folder.name,
      type: 'folder' as const,
      deleted_at: folder.deleted_at!,
      deleted_by: folder.deleted_by!,
      original_data: folder
    })));
  }

  // Get deleted templates
  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (templates) {
    trashItems.push(...templates.map(template => ({
      id: template.id,
      title: template.name,
      type: 'template' as const,
      deleted_at: template.deleted_at!,
      deleted_by: template.deleted_by!,
      original_data: template
    })));
  }

  // Get deleted music bases
  const { data: musicBases } = await supabase
    .from('music_bases')
    .select('*')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (musicBases) {
    trashItems.push(...musicBases.map(base => ({
      id: base.id,
      title: base.name,
      type: 'music_base' as const,
      deleted_at: base.deleted_at!,
      deleted_by: base.deleted_by!,
      original_data: base
    })));
  }

  return trashItems.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
};

// Restore functions for each type
export const restoreSong = async (songId: string): Promise<void> => {
  const { error } = await supabase
    .from('songs')
    .update({
      deleted_at: null,
      deleted_by: null
    })
    .eq('id', songId);

  if (error) throw error;
};

export const restoreDraft = async (draftId: string): Promise<void> => {
  const { error } = await supabase
    .from('drafts')
    .update({
      deleted_at: null,
      deleted_by: null
    })
    .eq('id', draftId);

  if (error) throw error;
};

export const restoreFolder = async (folderId: string): Promise<void> => {
  const { error } = await supabase
    .from('folders')
    .update({
      deleted_at: null,
      deleted_by: null
    })
    .eq('id', folderId);

  if (error) throw error;
};

export const restoreTemplate = async (templateId: string): Promise<void> => {
  const { error } = await supabase
    .from('templates')
    .update({
      deleted_at: null,
      deleted_by: null
    })
    .eq('id', templateId);

  if (error) throw error;
};

export const restoreMusicBase = async (musicBaseId: string): Promise<void> => {
  const { error } = await supabase
    .from('music_bases')
    .update({
      deleted_at: null,
      deleted_by: null
    })
    .eq('id', musicBaseId);

  if (error) throw error;
};

// Generic restore function
export const restoreItem = async (item: TrashItem): Promise<void> => {
  switch (item.type) {
    case 'song':
      await restoreSong(item.id);
      break;
    case 'draft':
      await restoreDraft(item.id);
      break;
    case 'folder':
      await restoreFolder(item.id);
      break;
    case 'template':
      await restoreTemplate(item.id);
      break;
    case 'music_base':
      await restoreMusicBase(item.id);
      break;
    default:
      throw new Error(`Unknown item type: ${item.type}`);
  }
};

// Permanent delete functions for each type
export const permanentDeleteSong = async (songId: string): Promise<void> => {
  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', songId);

  if (error) throw error;
};

export const permanentDeleteDraft = async (draftId: string): Promise<void> => {
  const { error } = await supabase
    .from('drafts')
    .delete()
    .eq('id', draftId);

  if (error) throw error;
};

export const permanentDeleteFolder = async (folderId: string): Promise<void> => {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId);

  if (error) throw error;
};

export const permanentDeleteTemplate = async (templateId: string): Promise<void> => {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', templateId);

  if (error) throw error;
};

export const permanentDeleteMusicBase = async (musicBaseId: string): Promise<void> => {
  const { error } = await supabase
    .from('music_bases')
    .delete()
    .eq('id', musicBaseId);

  if (error) throw error;
};

// Generic permanent delete function
export const permanentDeleteItem = async (item: TrashItem): Promise<void> => {
  switch (item.type) {
    case 'song':
      await permanentDeleteSong(item.id);
      break;
    case 'draft':
      await permanentDeleteDraft(item.id);
      break;
    case 'folder':
      await permanentDeleteFolder(item.id);
      break;
    case 'template':
      await permanentDeleteTemplate(item.id);
      break;
    case 'music_base':
      await permanentDeleteMusicBase(item.id);
      break;
    default:
      throw new Error(`Unknown item type: ${item.type}`);
  }
};

// Clean up expired items (older than 7 days)
export const cleanupExpiredTrashItems = async (): Promise<number> => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('User not authenticated');

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const expiryDate = sevenDaysAgo.toISOString();

  let deletedCount = 0;

  // Delete expired songs
  const { data: expiredSongs } = await supabase
    .from('songs')
    .select('id')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .lt('deleted_at', expiryDate);

  if (expiredSongs && expiredSongs.length > 0) {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .lt('deleted_at', expiryDate);
    
    if (!error) deletedCount += expiredSongs.length;
  }

  // Delete expired drafts
  const { data: expiredDrafts } = await supabase
    .from('drafts')
    .select('id')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .lt('deleted_at', expiryDate);

  if (expiredDrafts && expiredDrafts.length > 0) {
    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .lt('deleted_at', expiryDate);
    
    if (!error) deletedCount += expiredDrafts.length;
  }

  // Delete expired folders
  const { data: expiredFolders } = await supabase
    .from('folders')
    .select('id')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .lt('deleted_at', expiryDate);

  if (expiredFolders && expiredFolders.length > 0) {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .lt('deleted_at', expiryDate);
    
    if (!error) deletedCount += expiredFolders.length;
  }

  // Delete expired templates
  const { data: expiredTemplates } = await supabase
    .from('templates')
    .select('id')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .lt('deleted_at', expiryDate);

  if (expiredTemplates && expiredTemplates.length > 0) {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .lt('deleted_at', expiryDate);
    
    if (!error) deletedCount += expiredTemplates.length;
  }

  // Delete expired music bases
  const { data: expiredMusicBases } = await supabase
    .from('music_bases')
    .select('id')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .lt('deleted_at', expiryDate);

  if (expiredMusicBases && expiredMusicBases.length > 0) {
    const { error } = await supabase
      .from('music_bases')
      .delete()
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .lt('deleted_at', expiryDate);
    
    if (!error) deletedCount += expiredMusicBases.length;
  }

  return deletedCount;
};