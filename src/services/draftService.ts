
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

// Removed backup service exports since we're disabling that functionality
