-- Sponsors can upload their own banner picture; the picture folder itself is private,
-- so approved banners are shown through short-lived links created by the app.
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS banner_path text;

CREATE POLICY "sponsors upload own banner"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'sponsor-banners'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND name ~* '\.(jpg|jpeg|png|webp)$'
);

CREATE POLICY "sponsors read own banner"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'sponsor-banners'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "sponsors replace own banner"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'sponsor-banners'
  AND (storage.foldername(name))[1] = auth.uid()::text
);