-- Create partnership_parts table to manage music sections
CREATE TABLE public.partnership_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partnership_id UUID NOT NULL,
  user_id UUID NOT NULL,
  part_type TEXT NOT NULL CHECK (part_type IN ('solo', 'verse', 'pre_chorus', 'chorus', 'bridge', 'ending')),
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID
);

-- Add RLS
ALTER TABLE public.partnership_parts ENABLE ROW LEVEL SECURITY;

-- Policies for partnership_parts
CREATE POLICY "partnership_parts_select" ON public.partnership_parts
FOR SELECT USING (
  partnership_id IN (
    SELECT id FROM public.partnerships WHERE user_id = auth.uid()
  ) OR partnership_id IN (
    SELECT partnership_id FROM public.partnership_collaborators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "partnership_parts_insert" ON public.partnership_parts
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND (
    partnership_id IN (
      SELECT id FROM public.partnerships WHERE user_id = auth.uid()
    ) OR partnership_id IN (
      SELECT partnership_id FROM public.partnership_collaborators WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "partnership_parts_update" ON public.partnership_parts
FOR UPDATE USING (
  partnership_id IN (
    SELECT id FROM public.partnerships WHERE user_id = auth.uid()
  ) OR partnership_id IN (
    SELECT partnership_id FROM public.partnership_collaborators WHERE user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_partnership_parts_partnership_id ON public.partnership_parts(partnership_id);
CREATE INDEX idx_partnership_parts_status ON public.partnership_parts(status);

-- Add trigger for updated_at
CREATE TRIGGER update_partnership_parts_updated_at
  BEFORE UPDATE ON public.partnership_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();