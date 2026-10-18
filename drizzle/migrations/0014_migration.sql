CREATE TABLE public.improvement_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid,
  summary text NOT NULL,
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.improvement_plans TO authenticated;
GRANT ALL ON public.improvement_plans TO service_role;
ALTER TABLE public.improvement_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read plans" ON public.improvement_plans FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update plans" ON public.improvement_plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));