CREATE TABLE public.racing_data_sources (
  id text PRIMARY KEY, name text NOT NULL, kind text NOT NULL, licence_note text,
  status text NOT NULL DEFAULT 'not_connected', last_success_at timestamptz, last_error text, last_error_at timestamptz,
  records_imported integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.racecourses (
  id text PRIMARY KEY, name text NOT NULL, country text NOT NULL DEFAULT 'GB', surface text, source_id text REFERENCES public.racing_data_sources(id));
CREATE TABLE public.trainers (id text PRIMARY KEY, name text NOT NULL, source_id text REFERENCES public.racing_data_sources(id), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.jockeys (id text PRIMARY KEY, name text NOT NULL, source_id text REFERENCES public.racing_data_sources(id), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.horses (
  id text PRIMARY KEY, name text NOT NULL, foaled date, sex text, sire text, dam text, country text,
  trainer_id text REFERENCES public.trainers(id), source_id text REFERENCES public.racing_data_sources(id), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.horse_aliases (horse_id text NOT NULL REFERENCES public.horses(id) ON DELETE CASCADE, alias text NOT NULL, PRIMARY KEY (horse_id, alias));
CREATE TABLE public.meetings (
  id text PRIMARY KEY, racecourse_id text NOT NULL REFERENCES public.racecourses(id), meeting_date date NOT NULL,
  going text, surface text, status text NOT NULL DEFAULT 'scheduled', source_id text REFERENCES public.racing_data_sources(id), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX meetings_date_idx ON public.meetings(meeting_date);
CREATE TABLE public.races (
  id text PRIMARY KEY, meeting_id text NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE, off_time timestamptz NOT NULL,
  name text NOT NULL, race_type text, distance_yards integer, class text, prize_gbp numeric, going text, field_size integer,
  status text NOT NULL DEFAULT 'scheduled', updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX races_off_idx ON public.races(off_time);
CREATE TABLE public.runners (
  id text PRIMARY KEY, race_id text NOT NULL REFERENCES public.races(id) ON DELETE CASCADE, horse_id text NOT NULL REFERENCES public.horses(id),
  trainer_id text REFERENCES public.trainers(id), jockey_id text REFERENCES public.jockeys(id),
  cloth_number integer, draw integer, age integer, weight_lbs integer, official_rating integer, form text, headgear text,
  non_runner boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (race_id, horse_id));
CREATE INDEX runners_horse_idx ON public.runners(horse_id);
CREATE TABLE public.race_results (
  race_id text NOT NULL REFERENCES public.races(id) ON DELETE CASCADE, horse_id text NOT NULL REFERENCES public.horses(id),
  position integer, status text NOT NULL DEFAULT 'finished', starting_price_decimal numeric, beaten_lengths numeric,
  official boolean NOT NULL DEFAULT true, recorded_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (race_id, horse_id));
CREATE TABLE public.non_runners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), race_id text NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  horse_id text NOT NULL REFERENCES public.horses(id), reason text, declared_at timestamptz NOT NULL DEFAULT now(), source_id text REFERENCES public.racing_data_sources(id));
CREATE TABLE public.odds_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), race_id text NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  horse_id text NOT NULL REFERENCES public.horses(id), bookmaker text NOT NULL, decimal_odds numeric NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(), source_id text REFERENCES public.racing_data_sources(id));
CREATE INDEX odds_race_idx ON public.odds_snapshots(race_id, captured_at DESC);
CREATE TABLE public.racing_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_id text REFERENCES public.racing_data_sources(id), job text NOT NULL,
  status text NOT NULL, records integer NOT NULL DEFAULT 0, error text, started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz);
CREATE TABLE public.racing_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor uuid, entity text NOT NULL, entity_id text NOT NULL,
  action text NOT NULL, reason text, original jsonb, created_at timestamptz NOT NULL DEFAULT now());

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['racing_data_sources','racecourses','trainers','jockeys','horses','horse_aliases','meetings','races','runners','race_results','non_runners','odds_snapshots'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Public read" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['racing_import_logs','racing_audit_logs'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Admins read" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''))', t);
  END LOOP;
END $$;