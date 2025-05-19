
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

// Export only one version of createBackup (the wrapper function)
export const createBackup = async (title: string, content: string): Promise<Backup> => {
  const { createSystemBackup } = await import('./drafts/backupService');
  return createSystemBackup(title, content);
};
