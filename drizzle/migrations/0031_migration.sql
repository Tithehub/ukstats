CREATE TABLE public.arcade_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game text NOT NULL DEFAULT 'aim-high-vote-lowe',
  difficulty text NOT NULL CHECK (difficulty IN ('easy','normal','hard')),
  score integer NOT NULL CHECK (score >= 0),
  seconds integer NOT NULL CHECK (seconds >= 0),
  day date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.arcade_scores TO authenticated;
GRANT ALL ON public.arcade_scores TO service_role;
ALTER TABLE public.arcade_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players read own arcade scores" ON public.arcade_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX arcade_scores_board ON public.arcade_scores (game, difficulty, day, score DESC);

CREATE OR REPLACE FUNCTION public.arcade_leaderboard(_game text, _difficulty text, _since date, max_rows integer DEFAULT 20)
RETURNS TABLE(player text, best integer, runs bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(p.display_name, 'Player') AS player, MAX(a.score)::int AS best, COUNT(*) AS runs
  FROM public.arcade_scores a LEFT JOIN public.profiles p ON p.id = a.user_id
  WHERE a.game = _game AND a.difficulty = _difficulty AND (_since IS NULL OR a.day >= _since)
  GROUP BY a.user_id, p.display_name
  ORDER BY best DESC LIMIT LEAST(GREATEST(max_rows, 1), 50);
$$;
GRANT EXECUTE ON FUNCTION public.arcade_leaderboard(text, text, date, integer) TO anon, authenticated;