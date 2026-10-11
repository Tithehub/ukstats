CREATE TABLE public.agent_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid,
  kind text NOT NULL DEFAULT 'figure_of_day',
  metric_id text,
  platform text NOT NULL,
  body text NOT NULL,
  link text NOT NULL,
  source_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
ALTER TABLE public.agent_posts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.agent_posts TO authenticated;
GRANT ALL ON public.agent_posts TO service_role;
CREATE POLICY "Admins read agent posts" ON public.agent_posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update agent posts" ON public.agent_posts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX agent_posts_status_idx ON public.agent_posts (status, created_at DESC);