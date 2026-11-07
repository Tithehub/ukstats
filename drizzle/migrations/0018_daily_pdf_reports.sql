CREATE TABLE public.report_editions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition text NOT NULL CHECK (edition IN ('uk','global')),
  kind text NOT NULL DEFAULT 'daily' CHECK (kind IN ('daily','weekly','monthly')),
  report_date date NOT NULL,
  storage_path text NOT NULL,
  pages integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (edition, kind, report_date)
);
GRANT SELECT ON public.report_editions TO anon, authenticated;
GRANT ALL ON public.report_editions TO service_role;
ALTER TABLE public.report_editions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can list report editions" ON public.report_editions FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.report_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  edition text NOT NULL CHECK (edition IN ('uk','global')),
  report_date date NOT NULL,
  stripe_session_id text NOT NULL UNIQUE,
  environment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX report_purchases_user ON public.report_purchases(user_id);
GRANT SELECT ON public.report_purchases TO authenticated;
GRANT ALL ON public.report_purchases TO service_role;
ALTER TABLE public.report_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own report purchases" ON public.report_purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.report_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  edition text NOT NULL CHECK (edition IN ('uk','global')),
  price_id text NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  status text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  environment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX report_subscriptions_user ON public.report_subscriptions(user_id);
GRANT SELECT ON public.report_subscriptions TO authenticated;
GRANT ALL ON public.report_subscriptions TO service_role;
ALTER TABLE public.report_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own report subscriptions" ON public.report_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);