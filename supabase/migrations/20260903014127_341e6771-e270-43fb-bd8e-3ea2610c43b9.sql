CREATE TABLE public.metric_snapshots (
  metric_id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  value text,
  period text,
  as_of text,
  source text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.metric_snapshots TO service_role;
ALTER TABLE public.metric_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to metric snapshots" ON public.metric_snapshots FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE TABLE public.metric_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  value text,
  previous_value text,
  period text,
  as_of text,
  source text NOT NULL,
  source_url text NOT NULL,
  detected_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.metric_changes TO anon;
GRANT SELECT ON public.metric_changes TO authenticated;
GRANT ALL ON public.metric_changes TO service_role;
ALTER TABLE public.metric_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published figure changes are public" ON public.metric_changes FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX metric_changes_detected_at_idx ON public.metric_changes (detected_at DESC);