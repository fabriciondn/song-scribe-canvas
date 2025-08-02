-- Add a status field to author_registrations to track the analysis process
ALTER TABLE public.author_registrations 
ADD COLUMN IF NOT EXISTS analysis_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to set proper status
UPDATE public.author_registrations 
SET status = 'registered', analysis_completed_at = created_at 
WHERE status = 'draft';