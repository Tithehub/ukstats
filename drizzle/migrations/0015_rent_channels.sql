CREATE TABLE public.rent_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  logo_url text,
  accent text NOT NULL DEFAULT '#051D3F',
  presented_by text,
  layout text NOT NULL DEFAULT 'classic',
  countries text[] NOT NULL DEFAULT '{gb}',
  all_countries boolean NOT NULL DEFAULT false,
  presenter text NOT NULL DEFAULT 'self',
  show_sponsor_box boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rent_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$')
);
GRANT SELECT, INSERT, UPDATE ON public.rent_channels TO authenticated;
GRANT ALL ON public.rent_channels TO service_role;
ALTER TABLE public.rent_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own channel" ON public.rent_channels FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners create own channel" ON public.rent_channels FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own channel" ON public.rent_channels FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER rent_channels_updated BEFORE UPDATE ON public.rent_channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.rent_entitlements (
  user_id uuid PRIMARY KEY,
  active boolean NOT NULL DEFAULT false,
  max_countries integer NOT NULL DEFAULT 1,
  all_countries boolean NOT NULL DEFAULT false,
  ai_presenter boolean NOT NULL DEFAULT false,
  no_sponsor_box boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'manual',
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rent_entitlements TO authenticated;
GRANT INSERT, UPDATE ON public.rent_entitlements TO authenticated;
GRANT ALL ON public.rent_entitlements TO service_role;
ALTER TABLE public.rent_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own entitlement" ON public.rent_entitlements FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert entitlements" ON public.rent_entitlements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update entitlements" ON public.rent_entitlements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));