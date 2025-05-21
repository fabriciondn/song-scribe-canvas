
// Re-export all functions and types from the refactored services
// This maintains backward compatibility with code that imports from this file

export type { Draft, DraftInput } from './drafts/types';
export { 
  getDrafts,
  getDraftById,
  createDraft,
  updateDraft,
  deleteDraft
} from './drafts/draftService';
export { uploadAudio } from './drafts/audioService';
export { ensureAudioBucketExists } from './storage/storageBuckets';

// Import the Backup type for the return type
import type { Backup } from './drafts/backupService';

// Export only one version of createBackup (the wrapper function) - NOW A NO-OP FUNCTION
export const createBackup = async (title: string, content: string): Promise<Backup> => {
  // Skip importing and calling the real backup service
  console.log('Backup creation skipped (feature disabled)');
  
  // Return a mock backup object to maintain the function signature
  return {
    id: 'no-op-backup',
    title: title,
    file_path: '',
    created_at: new Date().toISOString(),
    is_system: true
  };
};
