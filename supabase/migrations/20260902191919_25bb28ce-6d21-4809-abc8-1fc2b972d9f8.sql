DROP POLICY IF EXISTS "Anyone can view live shared pages" ON public.shared_pages;
REVOKE SELECT ON public.shared_pages FROM anon;
REVOKE SELECT ON public.shared_pages FROM authenticated;
GRANT ALL ON public.shared_pages TO service_role;