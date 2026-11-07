DROP POLICY IF EXISTS "Rent logos public read" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can list report editions" ON public.report_editions;
CREATE OR REPLACE FUNCTION public.list_report_editions(max_rows integer DEFAULT 120)
RETURNS TABLE(edition text, kind text, report_date date, pages integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT edition, kind, report_date, pages FROM public.report_editions
  ORDER BY report_date DESC LIMIT greatest(1, least(coalesce(max_rows,120),500));
$$;
GRANT EXECUTE ON FUNCTION public.list_report_editions(integer) TO anon, authenticated;