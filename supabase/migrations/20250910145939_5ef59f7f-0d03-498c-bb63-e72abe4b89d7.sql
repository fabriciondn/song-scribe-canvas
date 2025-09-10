-- Create partnership_messages table for real-time chat
CREATE TABLE public.partnership_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partnership_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  audio_url TEXT,
  replied_to_message_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partnership_audio_recordings table for voice messages
CREATE TABLE public.partnership_audio_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partnership_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create segment_approvals table for approval system
CREATE TABLE public.segment_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partnership_id UUID NOT NULL,
  segment_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create segment_comments table for opinions/feedback
CREATE TABLE public.segment_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partnership_id UUID NOT NULL,
  segment_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.partnership_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_audio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for partnership_messages
CREATE POLICY "Partnership members can view messages" 
ON public.partnership_messages 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM partnerships p 
    WHERE p.id = partnership_messages.partnership_id 
    AND p.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM partnership_collaborators pc 
    WHERE pc.partnership_id = partnership_messages.partnership_id 
    AND pc.user_id = auth.uid() 
    AND pc.status = 'active'
  )
);

CREATE POLICY "Partnership members can send messages" 
ON public.partnership_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (
      SELECT 1 FROM partnerships p 
      WHERE p.id = partnership_messages.partnership_id 
      AND p.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM partnership_collaborators pc 
      WHERE pc.partnership_id = partnership_messages.partnership_id 
      AND pc.user_id = auth.uid() 
      AND pc.status = 'active'
    )
  )
);

-- Create policies for partnership_audio_recordings
CREATE POLICY "Partnership members can view audio recordings" 
ON public.partnership_audio_recordings 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM partnerships p 
    WHERE p.id = partnership_audio_recordings.partnership_id 
    AND p.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM partnership_collaborators pc 
    WHERE pc.partnership_id = partnership_audio_recordings.partnership_id 
    AND pc.user_id = auth.uid() 
    AND pc.status = 'active'
  )
);

CREATE POLICY "Partnership members can upload audio recordings" 
ON public.partnership_audio_recordings 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (
      SELECT 1 FROM partnerships p 
      WHERE p.id = partnership_audio_recordings.partnership_id 
      AND p.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM partnership_collaborators pc 
      WHERE pc.partnership_id = partnership_audio_recordings.partnership_id 
      AND pc.user_id = auth.uid() 
      AND pc.status = 'active'
    )
  )
);

-- Create policies for segment_approvals
CREATE POLICY "Partnership members can view segment approvals" 
ON public.segment_approvals 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM partnerships p 
    WHERE p.id = segment_approvals.partnership_id 
    AND p.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM partnership_collaborators pc 
    WHERE pc.partnership_id = segment_approvals.partnership_id 
    AND pc.user_id = auth.uid() 
    AND pc.status = 'active'
  )
);

-- Create policies for segment_comments
CREATE POLICY "Partnership members can view and create segment comments" 
ON public.segment_comments 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM partnerships p 
    WHERE p.id = segment_comments.partnership_id 
    AND p.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM partnership_collaborators pc 
    WHERE pc.partnership_id = segment_comments.partnership_id 
    AND pc.user_id = auth.uid() 
    AND pc.status = 'active'
  )
);

-- Create indexes for better performance
CREATE INDEX idx_partnership_messages_partnership_id ON public.partnership_messages(partnership_id);
CREATE INDEX idx_partnership_messages_created_at ON public.partnership_messages(created_at DESC);
CREATE INDEX idx_partnership_audio_recordings_partnership_id ON public.partnership_audio_recordings(partnership_id);
CREATE INDEX idx_segment_approvals_partnership_segment ON public.segment_approvals(partnership_id, segment_id);
CREATE INDEX idx_segment_comments_partnership_segment ON public.segment_comments(partnership_id, segment_id);