CREATE OR REPLACE FUNCTION public.get_public_rent_channel(_slug text)
RETURNS TABLE (slug text, display_name text, logo_url text, accent text, presented_by text, layout text, countries text[], all_countries boolean, presenter text, show_sponsor_box boolean, active boolean, expires_at timestamptz, max_countries integer, ent_all_countries boolean, ai_presenter boolean, no_sponsor_box boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.slug, c.display_name, c.logo_url, c.accent, c.presented_by, c.layout, c.countries, c.all_countries, c.presenter, c.show_sponsor_box,
         COALESCE(e.active, false), e.expires_at, COALESCE(e.max_countries, 1), COALESCE(e.all_countries, false), COALESCE(e.ai_presenter, false), COALESCE(e.no_sponsor_box, false)
  FROM public.rent_channels c LEFT JOIN public.rent_entitlements e ON e.user_id = c.user_id
  WHERE c.slug = lower(_slug)
$$;
GRANT EXECUTE ON FUNCTION public.get_public_rent_channel(text) TO anon, authenticated;