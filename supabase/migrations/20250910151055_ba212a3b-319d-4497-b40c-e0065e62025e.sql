-- Fix RLS policies to avoid infinite recursion - complete reset

-- Drop ALL existing policies on all partnership tables
DROP POLICY IF EXISTS "Users can view their partnerships" ON partnerships;
DROP POLICY IF EXISTS "Users can create partnerships" ON partnerships;
DROP POLICY IF EXISTS "Users can update their partnerships" ON partnerships;
DROP POLICY IF EXISTS "Users can delete their partnerships" ON partnerships;

DROP POLICY IF EXISTS "Collaborators can view partnership data" ON partnership_collaborators;
DROP POLICY IF EXISTS "Partnership creators can insert collaborators" ON partnership_collaborators;
DROP POLICY IF EXISTS "Partnership creators can update collaborators" ON partnership_collaborators;
DROP POLICY IF EXISTS "Partnership creators can delete collaborators" ON partnership_collaborators;
DROP POLICY IF EXISTS "Users can view collaborations" ON partnership_collaborators;
DROP POLICY IF EXISTS "Users can insert themselves as collaborators" ON partnership_collaborators;
DROP POLICY IF EXISTS "Users can update their collaboration status" ON partnership_collaborators;

DROP POLICY IF EXISTS "Users can view partnership compositions" ON partnership_compositions;
DROP POLICY IF EXISTS "Partnership members can create compositions" ON partnership_compositions;
DROP POLICY IF EXISTS "Partnership members can update compositions" ON partnership_compositions;

DROP POLICY IF EXISTS "Partnership members can view messages" ON partnership_messages;
DROP POLICY IF EXISTS "Partnership members can send messages" ON partnership_messages;

DROP POLICY IF EXISTS "Partnership members can view audio recordings" ON partnership_audio_recordings;
DROP POLICY IF EXISTS "Partnership members can upload audio recordings" ON partnership_audio_recordings;

DROP POLICY IF EXISTS "Partnership members can view segment approvals" ON segment_approvals;
DROP POLICY IF EXISTS "Partnership members can create segment approvals" ON segment_approvals;
DROP POLICY IF EXISTS "Partnership members can update segment approvals" ON segment_approvals;

DROP POLICY IF EXISTS "Partnership members can view segment comments" ON segment_comments;
DROP POLICY IF EXISTS "Partnership members can create segment comments" ON segment_comments;

-- Now create simple, non-recursive policies

-- Partnerships table
CREATE POLICY "Users can view their partnerships" ON partnerships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create partnerships" ON partnerships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their partnerships" ON partnerships
  FOR UPDATE USING (user_id = auth.uid());

-- Partnership collaborators table  
CREATE POLICY "Users can view collaborations" ON partnership_collaborators
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert themselves as collaborators" ON partnership_collaborators
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Partnership compositions table (more complex but safe)
CREATE POLICY "Partnership owners can manage compositions" ON partnership_compositions
  FOR ALL USING (
    partnership_id IN (
      SELECT id FROM partnerships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Partnership collaborators can view compositions" ON partnership_compositions
  FOR SELECT USING (
    partnership_id IN (
      SELECT partnership_id FROM partnership_collaborators WHERE user_id = auth.uid()
    )
  );

-- Partnership messages table
CREATE POLICY "Partnership members can view messages" ON partnership_messages
  FOR SELECT USING (
    partnership_id IN (
      SELECT id FROM partnerships WHERE user_id = auth.uid()
      UNION
      SELECT partnership_id FROM partnership_collaborators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Partnership members can send messages" ON partnership_messages
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND 
    partnership_id IN (
      SELECT id FROM partnerships WHERE user_id = auth.uid()
      UNION
      SELECT partnership_id FROM partnership_collaborators WHERE user_id = auth.uid()
    )
  );

-- Partnership audio recordings table
CREATE POLICY "Partnership members can manage audio" ON partnership_audio_recordings
  FOR ALL USING (
    partnership_id IN (
      SELECT id FROM partnerships WHERE user_id = auth.uid()
      UNION
      SELECT partnership_id FROM partnership_collaborators WHERE user_id = auth.uid()
    )
  );

-- Segment approvals table
CREATE POLICY "Partnership members can manage approvals" ON segment_approvals
  FOR ALL USING (
    partnership_id IN (
      SELECT id FROM partnerships WHERE user_id = auth.uid()
      UNION
      SELECT partnership_id FROM partnership_collaborators WHERE user_id = auth.uid()
    )
  );

-- Segment comments table
CREATE POLICY "Partnership members can manage comments" ON segment_comments
  FOR ALL USING (
    partnership_id IN (
      SELECT id FROM partnerships WHERE user_id = auth.uid()
      UNION
      SELECT partnership_id FROM partnership_collaborators WHERE user_id = auth.uid()
    )
  );