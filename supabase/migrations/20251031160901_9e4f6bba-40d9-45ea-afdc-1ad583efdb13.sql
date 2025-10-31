-- Drop the blocking insert policy
DROP POLICY IF EXISTS "No direct inserts allowed" ON public.public_registration_forms;

-- Create a new policy to allow public inserts
CREATE POLICY "Public can submit registration forms"
ON public.public_registration_forms
FOR INSERT
TO anon, authenticated
WITH CHECK (true);