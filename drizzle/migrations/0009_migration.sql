CREATE TABLE public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  product_id text not null,
  price_id text not null,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  environment text not null default 'sandbox',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.sponsors
  ADD COLUMN user_id uuid,
  ADD COLUMN plan text,
  ADD COLUMN stripe_subscription_id text UNIQUE,
  ADD COLUMN environment text,
  ADD COLUMN topic text,
  ADD COLUMN approved boolean NOT NULL DEFAULT false,
  ADD COLUMN paid boolean NOT NULL DEFAULT true;
DROP POLICY "Anyone reads active sponsors" ON public.sponsors;
CREATE POLICY "Anyone reads live sponsors" ON public.sponsors FOR SELECT TO anon, authenticated USING (active AND approved AND paid);
CREATE POLICY "Owners read own sponsor row" ON public.sponsors FOR SELECT TO authenticated USING (auth.uid() = user_id);