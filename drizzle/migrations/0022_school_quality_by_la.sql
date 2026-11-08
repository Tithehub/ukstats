create or replace function public.school_quality_by_la()
returns table(la text, rated bigint, good bigint)
language sql stable security invoker set search_path = public as $$
  select i.la, count(*) as rated,
         count(*) filter (where g->>'grade' in ('Good','Outstanding')) as good
  from public.education_institutions i,
       jsonb_array_elements(i.ofsted->'grades') g
  where i.kind = 'school' and i.ofsted->>'framework' = 'graded'
    and g->>'area' = 'Quality of education'
    and g->>'grade' in ('Outstanding','Good','Requires improvement','Inadequate')
    and i.la is not null
  group by i.la
$$;
grant execute on function public.school_quality_by_la() to anon, authenticated, service_role;