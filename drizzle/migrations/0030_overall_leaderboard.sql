CREATE OR REPLACE FUNCTION public.game_leaderboard(_game text, _since date, _until date, max_rows integer DEFAULT 50)
 RETURNS TABLE(player text, total bigint, games bigint, best integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COALESCE(NULLIF(p.display_name, ''), 'Player ' || left(s.user_id::text, 4)) AS player,
         SUM(s.score)::bigint, COUNT(*)::bigint, MAX(s.score)
  FROM public.game_scores s LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE (_game = 'overall' OR s.game = _game) AND s.day BETWEEN _since AND _until
  GROUP BY s.user_id, p.display_name
  ORDER BY 2 DESC, 3 ASC
  LIMIT LEAST(GREATEST(max_rows, 1), 100);
$function$;