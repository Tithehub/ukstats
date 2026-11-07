ALTER TABLE public.rent_channels ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.rent_channels ADD COLUMN IF NOT EXISTS requested_at timestamptz;
ALTER TABLE public.rent_entitlements ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.rent_entitlements ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.rent_entitlements ADD COLUMN IF NOT EXISTS environment text;
ALTER TABLE public.rent_entitlements ADD COLUMN IF NOT EXISTS sub_status text;
ALTER TABLE public.rent_entitlements ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

-- Owners may only move draft/paused -> pending; status changes beyond that are admin-only.
CREATE OR REPLACE FUNCTION public.rent_channel_status_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('draft','pending','active','paused') THEN RAISE EXCEPTION 'invalid status'; END IF;
  IF current_user IN ('authenticated','anon') AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' AND NEW.status NOT IN ('draft','pending') THEN NEW.status := 'draft'; END IF;
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NOT (NEW.status = 'pending' AND OLD.status IN ('draft','paused')) THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER rent_channels_status_guard BEFORE INSERT OR UPDATE ON public.rent_channels FOR EACH ROW EXECUTE FUNCTION public.rent_channel_status_guard();

CREATE POLICY "Admins update channels" ON public.rent_channels FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_rent_channels() RETURNS TABLE (user_id uuid, slug text, display_name text, status text, requested_at timestamptz, created_at timestamptz, email text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT c.user_id, c.slug, c.display_name, c.status, c.requested_at, c.created_at, u.email::text
    FROM public.rent_channels c LEFT JOIN auth.users u ON u.id = c.user_id ORDER BY c.requested_at DESC NULLS LAST, c.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.admin_rent_channels() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_rent_channels() TO authenticated;

CREATE OR REPLACE FUNCTION public.rent_slug_available(_slug text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.rent_channels WHERE slug = lower(_slug) AND user_id IS DISTINCT FROM auth.uid())
$$;
GRANT EXECUTE ON FUNCTION public.rent_slug_available(text) TO authenticated;

CREATE POLICY "Rent logos public read" ON storage.objects FOR SELECT USING (bucket_id = 'rent-logos');
CREATE POLICY "Owners upload rent logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'rent-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners update rent logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'rent-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete rent logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'rent-logos' AND (storage.foldername(name))[1] = auth.uid()::text);