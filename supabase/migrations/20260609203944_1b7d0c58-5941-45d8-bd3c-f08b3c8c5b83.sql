ALTER TABLE public.author_registrations REPLICA IDENTITY FULL;
ALTER TABLE public.drafts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.author_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drafts;