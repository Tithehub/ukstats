create table public.feed_checks (
  id uuid primary key default gen_random_uuid(),
  checked_at timestamptz not null default now(),
  metric_id text not null,
  title text not null,
  category text not null,
  source text not null,
  source_url text not null,
  status text not null,
  note text
);

GRANT SELECT ON public.feed_checks TO anon;
GRANT SELECT ON public.feed_checks TO authenticated;
GRANT ALL ON public.feed_checks TO service_role;

ALTER TABLE public.feed_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_checks public read" ON public.feed_checks FOR SELECT TO anon, authenticated USING (true);

create index feed_checks_metric_time on public.feed_checks (metric_id, checked_at desc);
create index feed_checks_time on public.feed_checks (checked_at desc);