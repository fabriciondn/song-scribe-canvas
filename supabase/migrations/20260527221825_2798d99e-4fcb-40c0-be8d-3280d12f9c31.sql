ALTER TABLE public.public_registration_forms 
ADD COLUMN IF NOT EXISTS works JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.public_registration_forms.works IS 'List of songs registered during onboarding, each with title, genre, lyrics and audio file info.';