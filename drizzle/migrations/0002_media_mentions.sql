create table if not exists public.media_mentions (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  outlet text not null,
  title text not null,
  image_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.media_mentions enable row level security;
revoke all on public.media_mentions from anon, authenticated;
grant select on public.media_mentions to authenticated;