DROP POLICY IF EXISTS payload_cache_public_read ON public.payload_cache;
REVOKE ALL ON public.payload_cache FROM anon, authenticated;
GRANT ALL ON public.payload_cache TO service_role;