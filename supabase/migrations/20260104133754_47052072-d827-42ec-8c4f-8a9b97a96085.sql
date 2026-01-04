-- Remove old policies that only allow owner access
DROP POLICY IF EXISTS "Users can view their own drafts" ON drafts;
DROP POLICY IF EXISTS "Users can update their own drafts" ON drafts;

-- Create new SELECT policy that allows owner OR collaborative participants
CREATE POLICY "Users and participants can view drafts" 
ON drafts FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM collaborative_sessions cs
    JOIN collaborative_participants cp ON cs.id = cp.session_id
    WHERE cs.draft_id = drafts.id
    AND cs.is_active = true
    AND cs.expires_at > now()
    AND cp.user_id = auth.uid()
  )
);

-- Create new UPDATE policy that allows owner OR collaborative participants
CREATE POLICY "Users and participants can update drafts"
ON drafts FOR UPDATE
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM collaborative_sessions cs
    JOIN collaborative_participants cp ON cs.id = cp.session_id
    WHERE cs.draft_id = drafts.id
    AND cs.is_active = true
    AND cs.expires_at > now()
    AND cp.user_id = auth.uid()
  )
);