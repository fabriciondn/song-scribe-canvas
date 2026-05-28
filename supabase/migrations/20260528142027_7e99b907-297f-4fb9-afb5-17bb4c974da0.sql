-- Make birth_date nullable as it is optional in the public form
ALTER TABLE public.public_registration_forms ALTER COLUMN birth_date DROP NOT NULL;

-- Allow anonymous users to upload to the author-registrations bucket
-- specifically within the public-registrations/ path
CREATE POLICY "Allow public uploads to author-registrations"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
    bucket_id = 'author-registrations' 
    AND (storage.foldername(name))[1] = 'public-registrations'
);

-- Ensure anon users can also read the files they uploaded (for previews if needed)
CREATE POLICY "Allow public select from author-registrations"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'author-registrations');
