CREATE TABLE public.sponsor_review_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('trustpilot','google','feefo','reviewsio','facebook')),
  url text NOT NULL CHECK (char_length(url) <= 500 AND url LIKE 'https://%'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sponsor_id, platform)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_review_links TO authenticated;
GRANT ALL ON public.sponsor_review_links TO service_role;
ALTER TABLE public.sponsor_review_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own review links" ON public.sponsor_review_links FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sponsors s WHERE s.id = sponsor_id AND s.user_id = auth.uid()));
CREATE POLICY "Owners add own review links" ON public.sponsor_review_links FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.sponsors s WHERE s.id = sponsor_id AND s.user_id = auth.uid()));
CREATE POLICY "Owners change own review links" ON public.sponsor_review_links FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sponsors s WHERE s.id = sponsor_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sponsors s WHERE s.id = sponsor_id AND s.user_id = auth.uid()));
CREATE POLICY "Owners remove own review links" ON public.sponsor_review_links FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sponsors s WHERE s.id = sponsor_id AND s.user_id = auth.uid()));

-- Signed-in non-admins can never approve their own links: any write by them resets to pending.
CREATE OR REPLACE FUNCTION public.review_link_status_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER review_link_status_guard BEFORE INSERT OR UPDATE ON public.sponsor_review_links
  FOR EACH ROW EXECUTE FUNCTION public.review_link_status_guard();