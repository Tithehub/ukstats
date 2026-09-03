CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  label text NOT NULL,
  credentials jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_posted_at timestamptz
);

CREATE INDEX social_accounts_user_idx ON public.social_accounts (user_id, created_at DESC);

GRANT ALL ON public.social_accounts TO service_role;

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to social accounts"
  ON public.social_accounts FOR ALL
  USING (false) WITH CHECK (false);