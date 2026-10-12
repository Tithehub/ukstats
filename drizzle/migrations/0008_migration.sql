CREATE TABLE public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  tagline text,
  placement text NOT NULL DEFAULT 'footer',
  active boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sponsors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sponsors TO authenticated;
GRANT ALL ON public.sponsors TO service_role;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active sponsors" ON public.sponsors FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "Admins manage sponsors" ON public.sponsors FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.sponsor_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  company text NOT NULL CHECK (char_length(company) BETWEEN 1 AND 200),
  website text CHECK (char_length(website) <= 500),
  message text CHECK (char_length(message) <= 2000),
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.sponsor_enquiries TO anon, authenticated;
GRANT SELECT, UPDATE ON public.sponsor_enquiries TO authenticated;
GRANT ALL ON public.sponsor_enquiries TO service_role;
ALTER TABLE public.sponsor_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can enquire" ON public.sponsor_enquiries FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');
CREATE POLICY "Admins read enquiries" ON public.sponsor_enquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update enquiries" ON public.sponsor_enquiries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));