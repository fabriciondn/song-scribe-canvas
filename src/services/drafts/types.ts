
// Types related to drafts
export interface Draft {
  id: string;
  title: string;
  content: string;
  audio_url?: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface DraftInput {
  title: string;
  content: string;
  audioUrl?: string;
}
