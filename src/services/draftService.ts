
// Re-export all functions and types from the refactored services
// This maintains backward compatibility with code that imports from this file

export { Draft, DraftInput } from './drafts/types';
export { 
  getDrafts,
  getDraftById,
  createDraft,
  updateDraft,
  deleteDraft,
  createBackup
} from './drafts/draftService';
export { uploadAudio } from './drafts/audioService';
export { ensureAudioBucketExists } from './storage/storageBuckets';
export { 
  getBackups,
  getBackupById,
  createSystemBackup,
  type Backup
} from './drafts/backupService';
