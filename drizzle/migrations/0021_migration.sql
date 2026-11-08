CREATE TABLE public.education_institutions (
  id text PRIMARY KEY,
  kind text NOT NULL,
  nation text NOT NULL DEFAULT 'England',
  name text NOT NULL,
  phase text,
  type text,
  type_group text,
  la text,
  region text,
  town text,
  postcode text,
  website text,
  low_age int,
  high_age int,
  pupils int,
  capacity int,
  fsm_pct numeric,
  gender text,
  religious text,
  admissions text,
  trust text,
  census_date text,
  ofsted jsonb,
  ks4 jsonb,
  provider jsonb,
  search text NOT NULL DEFAULT '',
  source_date text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.education_institutions TO anon, authenticated;
GRANT ALL ON public.education_institutions TO service_role;
ALTER TABLE public.education_institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Education register is public" ON public.education_institutions FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX education_institutions_kind_idx ON public.education_institutions (kind, name);
CREATE INDEX education_institutions_la_idx ON public.education_institutions (la);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX education_institutions_search_idx ON public.education_institutions USING gin (search gin_trgm_ops);