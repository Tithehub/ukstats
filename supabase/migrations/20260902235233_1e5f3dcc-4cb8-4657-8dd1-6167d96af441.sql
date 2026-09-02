CREATE TABLE public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  tier text NOT NULL,
  gbp_pence integer NOT NULL,
  chain text NOT NULL,
  address text NOT NULL,
  expected_amount numeric NOT NULL,
  quote_rate numeric NOT NULL,
  quote_expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'quoted',
  tx_hash text,
  confirmed_at timestamptz,
  owner_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payment_orders_slug_idx ON public.payment_orders (slug);
CREATE INDEX payment_orders_chain_status_idx ON public.payment_orders (chain, status);
CREATE UNIQUE INDEX payment_orders_tx_hash_idx ON public.payment_orders (chain, tx_hash) WHERE tx_hash IS NOT NULL;

GRANT ALL ON public.payment_orders TO service_role;

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;