CREATE TABLE public.citizen_journalists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 600),
  photo_url text CHECK (photo_url IS NULL OR photo_url ~ '^https://'),
  youtube_url text, youtube_channel_id text, x_url text, rumble_url text, substack_url text, website_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.citizen_journalists TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.citizen_journalists TO authenticated;
GRANT ALL ON public.citizen_journalists TO service_role;
ALTER TABLE public.citizen_journalists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved journalists are public" ON public.citizen_journalists FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Owners read own" ON public.citizen_journalists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners apply as pending" ON public.citizen_journalists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending' AND review_note IS NULL);
CREATE POLICY "Admins read all" ON public.citizen_journalists FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert" ON public.citizen_journalists FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update" ON public.citizen_journalists FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete" ON public.citizen_journalists FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER citizen_journalists_updated BEFORE UPDATE ON public.citizen_journalists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();