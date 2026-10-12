ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS banner_url text;
COMMENT ON COLUMN public.sponsors.banner_url IS 'Optional https image for the sponsor banner (Sponsor plan, admin-approved)';