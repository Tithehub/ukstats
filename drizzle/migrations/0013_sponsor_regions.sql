ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS regions text[];
UPDATE public.sponsors SET regions = ARRAY[region] WHERE regions IS NULL;
COMMENT ON COLUMN public.sponsors.region IS 'DEPRECATED: replaced by regions';