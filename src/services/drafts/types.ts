
// Types related to drafts
export interface Draft {
  id: string;
  title: string;
  content: string;
  audio_files?: AudioFile[];
  audio_url?: string; // Mantido para compatibilidade com versões anteriores
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface DraftInput {
  title: string;
  content: string;
  audioUrl?: string;
  audioFiles?: AudioFile[];
}

export interface AudioFile {
  id?: string;
  name: string;
  url: string;
  created_at?: string;
}

// Types for partnership functionality
export interface Segment {
  text: string;
  authorId: string;
  startOffset: number;
  endOffset: number;
}

export interface Partnership {
  id: string;
  title: string;
  description: string;
  date: string;
  creator: {
    name: string;
    email: string;
  };
  partners: {
    id: string;
    userId: string;
    name: string;
    email: string;
    permission: 'read' | 'edit';
    status: 'pending' | 'active';
  }[];
}
