-- Add trash/recycle bin functionality with soft delete
-- Add deleted_at and deleted_by columns to all tables that support deletion

ALTER TABLE public.songs 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN deleted_by UUID DEFAULT NULL;

ALTER TABLE public.drafts 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN deleted_by UUID DEFAULT NULL;

ALTER TABLE public.folders 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN deleted_by UUID DEFAULT NULL;

ALTER TABLE public.templates 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN deleted_by UUID DEFAULT NULL;

ALTER TABLE public.music_bases 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN deleted_by UUID DEFAULT NULL;

-- Create indexes for better performance when filtering deleted items
CREATE INDEX idx_songs_deleted_at ON public.songs(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_drafts_deleted_at ON public.drafts(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_folders_deleted_at ON public.folders(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_templates_deleted_at ON public.templates(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_music_bases_deleted_at ON public.music_bases(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create function to automatically clean up items older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_trash()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete songs older than 7 days from trash
  DELETE FROM public.songs 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '7 days';
  
  -- Delete drafts older than 7 days from trash
  DELETE FROM public.drafts 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '7 days';
  
  -- Delete folders older than 7 days from trash (and their contents)
  DELETE FROM public.folders 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '7 days';
  
  -- Delete templates older than 7 days from trash
  DELETE FROM public.templates 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '7 days';
  
  -- Delete music bases older than 7 days from trash
  DELETE FROM public.music_bases 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '7 days';
END;
$$;