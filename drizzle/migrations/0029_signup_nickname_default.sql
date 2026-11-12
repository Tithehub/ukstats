CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NULLIF(left(btrim(NEW.raw_user_meta_data->>'nickname'), 24), ''), 'Player-' || left(replace(NEW.id::text, '-', ''), 6)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;