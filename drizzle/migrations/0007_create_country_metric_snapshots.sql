CREATE TABLE public.country_metric_snapshots (
  code text NOT NULL,
  metric_id text NOT NULL,
  title text,
  value text,
  period text,
  source text,
  source_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (code, metric_id)
);
GRANT ALL ON public.country_metric_snapshots TO service_role;
ALTER TABLE public.country_metric_snapshots ENABLE ROW LEVEL SECURITY;