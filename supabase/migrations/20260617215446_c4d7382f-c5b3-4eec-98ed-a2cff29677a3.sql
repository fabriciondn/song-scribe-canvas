GRANT SELECT ON public.menu_functions TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.menu_functions TO authenticated;
GRANT ALL ON public.menu_functions TO service_role;