CREATE TABLE public.daily_briefings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  briefing_date date NOT NULL UNIQUE,
  headline text NOT NULL,
  body text NOT NULL,
  figures jsonb NOT NULL DEFAULT '[]'::jsonb,
  change_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.daily_briefings TO anon;
GRANT SELECT ON public.daily_briefings TO authenticated;
GRANT ALL ON public.daily_briefings TO service_role;

ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily statements are public"
ON public.daily_briefings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_daily_briefings_updated_at
BEFORE UPDATE ON public.daily_briefings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX daily_briefings_date_idx ON public.daily_briefings (briefing_date DESC);