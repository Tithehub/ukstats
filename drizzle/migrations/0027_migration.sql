CREATE TABLE public.game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game text NOT NULL,
  day date NOT NULL,
  score integer NOT NULL,
  max_score integer NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game, day)
);
GRANT SELECT ON public.game_scores TO authenticated;
GRANT ALL ON public.game_scores TO service_role;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players read own scores" ON public.game_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.game_leaderboard(_game text, _since date, _until date, max_rows integer DEFAULT 50)
RETURNS TABLE(player text, total bigint, games bigint, best integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(NULLIF(p.display_name, ''), 'Player ' || left(s.user_id::text, 4)) AS player,
         SUM(s.score)::bigint, COUNT(*)::bigint, MAX(s.score)
  FROM public.game_scores s LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE s.game = _game AND s.day BETWEEN _since AND _until
  GROUP BY s.user_id, p.display_name
  ORDER BY 2 DESC, 3 ASC
  LIMIT LEAST(GREATEST(max_rows, 1), 100);
$$;
GRANT EXECUTE ON FUNCTION public.game_leaderboard(text, date, date, integer) TO anon, authenticated;