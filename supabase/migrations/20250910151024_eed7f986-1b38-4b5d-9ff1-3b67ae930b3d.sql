-- Fix RLS policies to avoid infinite recursion

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their partnerships" ON partnerships;
DROP POLICY IF EXISTS "Users can create partnerships" ON partnerships;
DROP POLICY IF EXISTS "Users can update their partnerships" ON partnerships;

DROP POLICY IF EXISTS "Collaborators can view partnership data" ON partnership_collaborators;
DROP POLICY IF EXISTS "Partnership creators can insert collaborators" ON partnership_collaborators;
DROP POLICY IF EXISTS "Partnership creators can update collaborators" ON partnership_collaborators;
DROP POLICY IF EXISTS "Partnership creators can delete collaborators" ON partnership_collaborators;

-- Recreate simple, non-recursive policies for partnerships
CREATE POLICY "Users can view their partnerships" ON partnerships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create partnerships" ON partnerships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their partnerships" ON partnerships
  FOR UPDATE USING (user_id = auth.uid());

-- Recreate simple policies for partnership_collaborators
CREATE POLICY "Users can view collaborations" ON partnership_collaborators
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert themselves as collaborators" ON partnership_collaborators
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their collaboration status" ON partnership_collaborators
  FOR UPDATE USING (user_id = auth.uid());

-- Also fix other tables policies
DROP POLICY IF EXISTS "Users can view partnership compositions" ON partnership_compositions;
DROP POLICY IF EXISTS "Partnership members can create compositions" ON partnership_compositions;
DROP POLICY IF EXISTS "Partnership members can update compositions" ON partnership_compositions;

-- Recreate partnership_compositions policies
CREATE POLICY "Users can view partnership compositions" ON partnership_compositions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM partnerships p 
      WHERE p.id = partnership_id 
      AND p.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM partnership_collaborators pc 
      WHERE pc.partnership_id = partnership_id 
      AND pc.user_id = auth.uid()
    )
  );

CREATE POLICY "Partnership members can create compositions" ON partnership_compositions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM partnerships p 
      WHERE p.id = partnership_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Partnership members can update compositions" ON partnership_compositions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM partnerships p 
      WHERE p.id = partnership_id 
      AND p.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM partnership_collaborators pc 
      WHERE pc.partnership_id = partnership_id 
      AND pc.user_id = auth.uid()
    )
  );