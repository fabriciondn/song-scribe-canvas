
import { supabase } from '@/integrations/supabase/client';
import { Draft, DraftInput, AudioFile } from './types';
import { uploadAudio } from './audioService';
import { createSystemBackup } from './backupService';
import { ensureAudioBucketExists } from '../storage/storageBuckets';
import { nanoid } from 'nanoid';

// Tipos para os componentes de parceria
interface PartnershipData {
  id: string;
  title: string;
  description: string;
  created_at: string;
  user_id: string;
  partnership_collaborators?: CollaboratorData[];
}

interface CollaboratorData {
  id: string;
  user_id: string;
  permission: 'read' | 'edit';
  status: 'pending' | 'active';
  profiles?: {
    id: string;
    name?: string;
    email?: string;
  };
}

interface ProfileInfo {
  id: string;
  name?: string;
  email?: string;
}

export const getDrafts = async (): Promise<Draft[]> => {
  try {
    // Use RPC function
    const { data, error } = await supabase
      .rpc('get_drafts') as {
        data: Draft[] | null;
        error: any;
      };
    
    if (error) {
      // Fallback to direct query
      const { data: directData, error: directError } = await supabase
        .from('drafts')
        .select('*')
        .is('deleted_at', null) // Exclude deleted drafts
        .order('created_at', { ascending: false }) as {
          data: Draft[] | null,
          error: any
        };
      
      if (directError) throw directError;
      return directData || [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching drafts:', error);
    throw error;
  }
};

export const getDraftById = async (draftId: string): Promise<Draft | null> => {
  try {
    // Use RPC function
    const { data, error } = await supabase
      .rpc('get_draft_by_id', { draft_id: draftId }) as {
        data: Draft | null;
        error: any;
      };
    
    if (error) {
      // Fallback to direct query
      const { data: directData, error: directError } = await supabase
        .from('drafts')
        .select('*')
        .eq('id', draftId)
        .single() as {
          data: Draft | null,
          error: any
        };
      
      if (directError) throw directError;
      return directData;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching draft with ID ${draftId}:`, error);
    throw error;
  }
};

export const createDraft = async (draft: DraftInput): Promise<Draft> => {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Ensure the audio bucket exists before trying to use it
    await ensureAudioBucketExists();
    
    // Prepare data for insert
    const draftData: any = {
      title: draft.title,
      content: draft.content,
      user_id: userId
    };
    
    // Adicionar informações de áudio, se disponíveis
    if (draft.audioFiles && draft.audioFiles.length > 0) {
      draftData.audio_files = draft.audioFiles;
      // Para compatibilidade com a versão anterior, também definimos audio_url
      draftData.audio_url = draft.audioFiles[0].url;
    } else if (draft.audioUrl) {
      draftData.audio_url = draft.audioUrl;
    }
    
    // Direct insert since RPC function doesn't support the new audio_files field
    const { data: newDraft, error } = await supabase
      .from('drafts')
      .insert(draftData)
      .select()
      .single() as {
        data: Draft | null,
        error: any
      };
    
    if (error) throw error;
    return newDraft as Draft;
  } catch (error) {
    console.error('Error creating draft:', error);
    throw error;
  }
};

export const updateDraft = async (
  draftId: string,
  updates: {
    title?: string;
    content?: string;
    audioUrl?: string;
    audioFiles?: AudioFile[];
  }
): Promise<Draft> => {
  try {
    // Prepare data for update
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    
    // Atualizar informações de áudio
    if (updates.audioFiles && updates.audioFiles.length > 0) {
      updateData.audio_files = updates.audioFiles;
      // Para compatibilidade com a versão anterior, também definimos audio_url
      updateData.audio_url = updates.audioFiles[0].url;
    } else if (updates.audioUrl) {
      updateData.audio_url = updates.audioUrl;
    }
    
    // Direct update since RPC function doesn't support the new audio_files field
    const { data: updatedDraft, error } = await supabase
      .from('drafts')
      .update(updateData)
      .eq('id', draftId)
      .select()
      .single() as {
        data: Draft | null,
        error: any
      };
    
    if (error) throw error;
    return updatedDraft as Draft;
  } catch (error) {
    console.error(`Error updating draft with ID ${draftId}:`, error);
    throw error;
  }
};

export const deleteDraft = async (draftId: string): Promise<void> => {
  try {
    // Use soft delete instead of hard delete
    const { error: directError } = await supabase
      .from('drafts')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', draftId);
    
    if (directError) throw directError;
  } catch (error) {
    console.error(`Error deleting draft with ID ${draftId}:`, error);
    throw error;
  }
};

// Create a backup directly to the backup system
export const createBackup = async (title: string, content: string): Promise<void> => {
  try {
    await createSystemBackup(title, content);
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

// New functions for partnership collaboration

/**
 * Generate a unique collaboration token for a partnership
 */
export const generateCollaborationToken = async (partnershipId: string): Promise<string> => {
  try {
    // Create a unique token using nanoid
    const token = nanoid(12);
    
    // Store the token in the database linked to the partnership
    const { error } = await supabase
      .from('partnership_tokens')
      .insert({
        partnership_id: partnershipId,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      });
    
    if (error) throw error;
    return token;
  } catch (error) {
    console.error('Error generating collaboration token:', error);
    throw error;
  }
};

/**
 * Validate a collaboration token and join the partnership
 */
export const validateCollaborationToken = async (token: string): Promise<{
  valid: boolean;
  partnershipId?: string;
  error?: string;
}> => {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return { valid: false, error: 'User not authenticated' };
    }
    
    // Find the token in the database
    const { data, error } = await supabase
      .from('partnership_tokens')
      .select('partnership_id, expires_at, used')
      .eq('token', token)
      .single();
    
    if (error || !data) {
      return { valid: false, error: 'Invalid or expired token' };
    }
    
    // Cast data to expected type
    const tokenData = data as {
      partnership_id: string;
      expires_at: string;
      used: boolean;
    };
    
    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date() || tokenData.used) {
      return { valid: false, error: 'Token has expired or already been used' };
    }
    
    // Add user to partnership
    const { error: partnerError } = await supabase
      .from('partnership_collaborators')
      .insert({
        partnership_id: tokenData.partnership_id,
        user_id: userId,
        permission: 'edit',
        status: 'active'
      });
    
    if (partnerError) {
      return { valid: false, error: 'Error joining partnership' };
    }
    
    // Mark token as used
    await supabase
      .from('partnership_tokens')
      .update({ used: true })
      .eq('token', token);
    
    return { valid: true, partnershipId: tokenData.partnership_id };
  } catch (error) {
    console.error('Error validating token:', error);
    return { valid: false, error: 'Error processing token' };
  }
};

/**
 * Get all partnerships the current user is part of
 */
export const getUserPartnerships = async () => {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Get partnerships where the user is the creator
    const { data: createdPartnerships, error: createdError } = await supabase
      .from('partnerships')
      .select('*')
      .eq('user_id', userId);
      
    if (createdError) throw createdError;
    
    // Get user profile for the current user
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', userId)
      .single();
    
    const userProfile = profileData || { name: 'Unknown', email: '' };
    
    // Return simplified partnerships format
    return (createdPartnerships || []).map(partnership => ({
      id: partnership.id,
      title: partnership.title,
      description: partnership.description || '',
      date: new Date(partnership.created_at).toLocaleDateString(),
      creator: userProfile,
      partners: [] // Simplified - no partners for now
    }));
  } catch (error) {
    console.error('Error getting user partnerships:', error);
    throw error;
  }
};

/**
 * Update the content of a partnership composition with author tracking
 */
export const updatePartnershipComposition = async (
  partnershipId: string,
  content: string,
  authorId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('partnership_compositions')
      .update({ 
        content, 
        updated_at: new Date().toISOString(),
        last_modified_by: authorId
      })
      .eq('partnership_id', partnershipId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating partnership composition:', error);
    throw error;
  }
};
