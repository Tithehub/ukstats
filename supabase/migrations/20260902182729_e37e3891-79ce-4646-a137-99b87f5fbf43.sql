CREATE TABLE public.shared_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  metric_ids TEXT[] NOT NULL DEFAULT '{}',
  tier TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  price_pence INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  owner_hash TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX shared_pages_owner_hash_idx ON public.shared_pages (owner_hash);

GRANT SELECT ON public.shared_pages TO anon;
GRANT SELECT ON public.shared_pages TO authenticated;
GRANT ALL ON public.shared_pages TO service_role;

ALTER TABLE public.shared_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live shared pages"
ON public.shared_pages
FOR SELECT
TO anon, authenticated
USING (expires_at > now());