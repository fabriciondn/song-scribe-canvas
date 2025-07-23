-- Fix infinite recursion in partnerships RLS policies
-- Step 1: Drop all existing conflicting policies on partnerships table
DROP POLICY IF EXISTS "Collaborators can view partnerships" ON public.partnerships;
DROP POLICY IF EXISTS "Partnership owners can manage" ON public.partnerships;
DROP POLICY IF EXISTS "Users can delete their own partnerships" ON public.partnerships;
DROP POLICY IF EXISTS "Users can insert their own partnerships" ON public.partnerships;
DROP POLICY IF EXISTS "Users can update their own partnerships" ON public.partnerships;
DROP POLICY IF EXISTS "Users can view their partnerships" ON public.partnerships;

-- Step 2: Create clean, non-overlapping policies

-- Policy for partnership owners to manage their own partnerships
CREATE POLICY "Partnership owners can manage their partnerships" 
ON public.partnerships 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for collaborators to view partnerships they are part of
CREATE POLICY "Collaborators can view partnerships they belong to" 
ON public.partnerships 
FOR SELECT 
USING (
  id IN (
    SELECT partnership_id 
    FROM public.partnership_collaborators 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Step 3: Verify partnership_collaborators policies are correct
-- Drop any potentially problematic policies and recreate them cleanly
DROP POLICY IF EXISTS "Partnership members can delete collaborators" ON public.partnership_collaborators;
DROP POLICY IF EXISTS "Partnership members can insert collaborators" ON public.partnership_collaborators;
DROP POLICY IF EXISTS "Partnership members can update collaborators" ON public.partnership_collaborators;
DROP POLICY IF EXISTS "Users can view partnership collaborators" ON public.partnership_collaborators;

-- Recreate partnership_collaborators policies without circular references
CREATE POLICY "Partnership owners can manage collaborators" 
ON public.partnership_collaborators 
FOR ALL 
USING (
  partnership_id IN (
    SELECT id FROM public.partnerships WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  partnership_id IN (
    SELECT id FROM public.partnerships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view collaborators of partnerships they belong to" 
ON public.partnership_collaborators 
FOR SELECT 
USING (
  partnership_id IN (
    SELECT id FROM public.partnerships WHERE user_id = auth.uid()
    UNION
    SELECT partnership_id FROM public.partnership_collaborators WHERE user_id = auth.uid()
  )
);