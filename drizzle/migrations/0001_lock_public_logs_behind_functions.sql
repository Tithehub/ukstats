-- Stop direct table reads; public access goes through controlled functions only.

drop policy if exists "Daily statements are public" on public.daily_briefings;
drop policy if exists "feed_checks public read" on public.feed_checks;
drop policy if exists "Published figure changes are public" on public.metric_changes;

revoke select on public.daily_briefings from anon, authenticated;
revoke select on public.feed_checks from anon, authenticated;
revoke select on public.metric_changes from anon, authenticated;

create or replace function public.list_daily_briefings(max_rows int default 400)
returns setof public.daily_briefings
language sql stable security definer set search_path = public as $$
  select * from public.daily_briefings
  order by briefing_date desc
  limit greatest(1, least(coalesce(max_rows, 400), 1000));
$$;

create or replace function public.get_daily_briefing(day date)
returns setof public.daily_briefings
language sql stable security definer set search_path = public as $$
  select * from public.daily_briefings where briefing_date = day;
$$;

create or replace function public.list_recent_changes(max_rows int default 50)
returns setof public.metric_changes
language sql stable security definer set search_path = public as $$
  select * from public.metric_changes
  order by detected_at desc
  limit greatest(1, least(coalesce(max_rows, 50), 500));
$$;

create or replace function public.list_feed_checks(max_rows int default 20000, since timestamptz default now() - interval '30 days')
returns setof public.feed_checks
language sql stable security definer set search_path = public as $$
  select * from public.feed_checks
  where checked_at >= coalesce(since, now() - interval '30 days')
  order by checked_at desc
  limit greatest(1, least(coalesce(max_rows, 20000), 20000));
$$;

grant execute on function public.list_daily_briefings(int) to anon, authenticated;
grant execute on function public.get_daily_briefing(date) to anon, authenticated;
grant execute on function public.list_recent_changes(int) to anon, authenticated;
grant execute on function public.list_feed_checks(int, timestamptz) to anon, authenticated;