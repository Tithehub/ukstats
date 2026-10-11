create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  lease_until timestamptz not null default now() + interval '15 minutes',
  status text not null default 'running',
  pause_reason text,
  summary jsonb not null default '{}'::jsonb,
  briefing text
);
grant select on public.agent_runs to authenticated;
grant all on public.agent_runs to service_role;
alter table public.agent_runs enable row level security;
create policy "Admins read agent runs" on public.agent_runs for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.agent_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid,
  agent text not null,
  severity text not null default 'info',
  metric_id text,
  title text not null,
  detail text,
  url text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
create index agent_findings_run_idx on public.agent_findings(run_id);
grant select, update on public.agent_findings to authenticated;
grant all on public.agent_findings to service_role;
alter table public.agent_findings enable row level security;
create policy "Admins read findings" on public.agent_findings for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update findings" on public.agent_findings for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.explainer_drafts (
  id uuid primary key default gen_random_uuid(),
  metric_id text not null,
  title text not null,
  summary text not null,
  sections jsonb not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create unique index explainer_drafts_one_approved on public.explainer_drafts(metric_id) where status = 'approved';
grant select, update on public.explainer_drafts to authenticated;
grant all on public.explainer_drafts to service_role;
alter table public.explainer_drafts enable row level security;
create policy "Admins read drafts" on public.explainer_drafts for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update drafts" on public.explainer_drafts for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.metric_revisions (
  id uuid primary key default gen_random_uuid(),
  metric_id text not null,
  title text not null,
  period text not null,
  old_value text not null,
  new_value text not null,
  source text,
  source_url text,
  detected_at timestamptz not null default now(),
  unique (metric_id, period, old_value, new_value)
);
grant all on public.metric_revisions to service_role;
alter table public.metric_revisions enable row level security;

create or replace function public.list_metric_revisions(_metric_id text, max_rows int default 50)
returns setof public.metric_revisions language sql stable security definer set search_path = public as $$
  select * from public.metric_revisions where metric_id = _metric_id order by detected_at desc limit least(greatest(max_rows,1),200)
$$;
grant execute on function public.list_metric_revisions(text, int) to anon, authenticated;

create or replace function public.get_approved_explainer(_metric_id text)
returns table(title text, summary text, sections jsonb) language sql stable security definer set search_path = public as $$
  select title, summary, sections from public.explainer_drafts where metric_id = _metric_id and status = 'approved' limit 1
$$;
grant execute on function public.get_approved_explainer(text) to anon, authenticated;