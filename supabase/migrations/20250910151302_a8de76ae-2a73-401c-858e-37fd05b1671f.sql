-- Complete fix for RLS recursion issues
-- Drop all existing problematic policies and recreate with safe patterns

-- Disable RLS temporarily to clean up
ALTER TABLE partnerships DISABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_compositions DISABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_audio_recordings DISABLE ROW LEVEL SECURITY;
ALTER TABLE segment_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE segment_comments DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DO $$
DECLARE 
    r RECORD;
BEGIN
    -- Drop policies from partnerships
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'partnerships') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON partnerships';
    END LOOP;
    
    -- Drop policies from partnership_collaborators
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'partnership_collaborators') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON partnership_collaborators';
    END LOOP;
    
    -- Drop policies from partnership_compositions  
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'partnership_compositions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON partnership_compositions';
    END LOOP;
    
    -- Drop policies from partnership_messages
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'partnership_messages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON partnership_messages';
    END LOOP;
    
    -- Drop policies from partnership_audio_recordings
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'partnership_audio_recordings') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON partnership_audio_recordings';
    END LOOP;
    
    -- Drop policies from segment_approvals
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'segment_approvals') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON segment_approvals';
    END LOOP;
    
    -- Drop policies from segment_comments
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'segment_comments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON segment_comments';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_audio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_comments ENABLE ROW LEVEL SECURITY;

-- Create simple, safe policies for partnerships
CREATE POLICY "partnerships_select" ON partnerships FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "partnerships_insert" ON partnerships FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "partnerships_update" ON partnerships FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "partnerships_delete" ON partnerships FOR DELETE USING (user_id = auth.uid());

-- Create safe policies for partnership_collaborators
CREATE POLICY "collaborators_select" ON partnership_collaborators FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "collaborators_insert" ON partnership_collaborators FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "collaborators_update" ON partnership_collaborators FOR UPDATE USING (user_id = auth.uid());

-- Create safe policies for partnership_compositions
CREATE POLICY "compositions_select" ON partnership_compositions FOR SELECT USING (
  partnership_id IN (
    SELECT id FROM partnerships WHERE user_id = auth.uid()
  )
);
CREATE POLICY "compositions_insert" ON partnership_compositions FOR INSERT WITH CHECK (
  partnership_id IN (
    SELECT id FROM partnerships WHERE user_id = auth.uid()
  )
);
CREATE POLICY "compositions_update" ON partnership_compositions FOR UPDATE USING (
  partnership_id IN (
    SELECT id FROM partnerships WHERE user_id = auth.uid()
  )
);

-- Create safe policies for partnership_messages
CREATE POLICY "messages_select" ON partnership_messages FOR SELECT USING (
  user_id = auth.uid() OR partnership_id IN (
    SELECT id FROM partnerships WHERE user_id = auth.uid()
  )
);
CREATE POLICY "messages_insert" ON partnership_messages FOR INSERT WITH CHECK (
  user_id = auth.uid() AND partnership_id IN (
    SELECT id FROM partnerships WHERE user_id = auth.uid()
  )
);

-- Create safe policies for partnership_audio_recordings
CREATE POLICY "audio_select" ON partnership_audio_recordings FOR SELECT USING (
  user_id = auth.uid() OR partnership_id IN (
    SELECT id FROM partnerships WHERE user_id = auth.uid()
  )
);
CREATE POLICY "audio_insert" ON partnership_audio_recordings FOR INSERT WITH CHECK (
  user_id = auth.uid() AND partnership_id IN (
    SELECT id FROM partnerships WHERE user_id = auth.uid()
  )
);

-- Create safe policies for segment_approvals
CREATE POLICY "approvals_select" ON segment_approvals FOR SELECT USING (
  user_id = auth.uid() OR partnership_id IN (
    SELECT id FROM partnerships WHERE user_id = auth.uid()
  )
);
CREATE POLICY "approvals_insert" ON segment_approvals FOR INSERT WITH CHECK (
  user_id = auth.uid() AND partnership_id IN (
    SELECT id FROM partnerships WHERE user_id = auth.uid()
  )
);
CREATE POLICY "approvals_update" ON segment_approvals FOR UPDATE USING (
  user_id = auth.uid() OR partnership_id IN (
    SELECT id FROM partnerships WHERE user_id = auth.uid()
  )
);

-- Create safe policies for segment_comments
CREATE POLICY "comments_select" ON segment_comments FOR SELECT USING (
  user_id = auth.uid() OR partnership_id IN (
    SELECT id FROM partnerships WHERE user_id = auth.uid()
  )
);
CREATE POLICY "comments_insert" ON segment_comments FOR INSERT WITH CHECK (
  user_id = auth.uid() AND partnership_id IN (
    SELECT id FROM partnerships WHERE user_id = auth.uid()
  )
);