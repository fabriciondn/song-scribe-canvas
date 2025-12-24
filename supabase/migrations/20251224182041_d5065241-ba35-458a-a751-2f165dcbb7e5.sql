-- Create collaborative_sessions table
CREATE TABLE public.collaborative_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id UUID NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  draft_id UUID REFERENCES public.drafts(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collaborative_participants table
CREATE TABLE public.collaborative_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.collaborative_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_collaborative_sessions_host ON public.collaborative_sessions(host_user_id);
CREATE INDEX idx_collaborative_sessions_token ON public.collaborative_sessions(session_token);
CREATE INDEX idx_collaborative_sessions_draft ON public.collaborative_sessions(draft_id);
CREATE INDEX idx_collaborative_participants_session ON public.collaborative_participants(session_id);
CREATE INDEX idx_collaborative_participants_user ON public.collaborative_participants(user_id);

-- Enable RLS
ALTER TABLE public.collaborative_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborative_participants ENABLE ROW LEVEL SECURITY;

-- Enable Realtime for drafts table
ALTER TABLE public.drafts REPLICA IDENTITY FULL;

-- RLS Policies for collaborative_sessions
CREATE POLICY "Users can view sessions they host or participate in"
  ON public.collaborative_sessions
  FOR SELECT
  USING (
    host_user_id = auth.uid() OR 
    id IN (SELECT session_id FROM public.collaborative_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create their own sessions"
  ON public.collaborative_sessions
  FOR INSERT
  WITH CHECK (host_user_id = auth.uid());

CREATE POLICY "Hosts can update their sessions"
  ON public.collaborative_sessions
  FOR UPDATE
  USING (host_user_id = auth.uid());

CREATE POLICY "Hosts can delete their sessions"
  ON public.collaborative_sessions
  FOR DELETE
  USING (host_user_id = auth.uid());

CREATE POLICY "Authenticated users can view active sessions by token"
  ON public.collaborative_sessions
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true AND expires_at > now());

-- RLS Policies for collaborative_participants
CREATE POLICY "Participants can view other participants in their sessions"
  ON public.collaborative_participants
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.collaborative_sessions 
      WHERE host_user_id = auth.uid()
    ) OR
    session_id IN (
      SELECT session_id FROM public.collaborative_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join sessions"
  ON public.collaborative_participants
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participant status"
  ON public.collaborative_participants
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can leave sessions"
  ON public.collaborative_participants
  FOR DELETE
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_collaborative_sessions_updated_at
  BEFORE UPDATE ON public.collaborative_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();