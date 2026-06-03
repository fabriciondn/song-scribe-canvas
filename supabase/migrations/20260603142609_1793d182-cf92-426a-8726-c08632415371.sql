DROP POLICY IF EXISTS "Admins can create author registrations" ON public.author_registrations;
CREATE POLICY "Admins can create author registrations"
ON public.author_registrations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  )
);

DROP POLICY IF EXISTS "Admins can update all author registrations" ON public.author_registrations;
CREATE POLICY "Admins can update all author registrations"
ON public.author_registrations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  )
);

DROP POLICY IF EXISTS "Admins can delete all author registrations" ON public.author_registrations;
CREATE POLICY "Admins can delete all author registrations"
ON public.author_registrations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  )
);

DROP POLICY IF EXISTS "Admins can upload author registration files" ON storage.objects;
CREATE POLICY "Admins can upload author registration files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'author-registrations'
  AND EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  )
);

DROP POLICY IF EXISTS "Admins can view author registration files" ON storage.objects;
CREATE POLICY "Admins can view author registration files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'author-registrations'
  AND EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  )
);

DROP POLICY IF EXISTS "Admins can update author registration files" ON storage.objects;
CREATE POLICY "Admins can update author registration files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'author-registrations'
  AND EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  )
)
WITH CHECK (
  bucket_id = 'author-registrations'
  AND EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  )
);

DROP POLICY IF EXISTS "Admins can delete author registration files" ON storage.objects;
CREATE POLICY "Admins can delete author registration files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'author-registrations'
  AND EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  )
);