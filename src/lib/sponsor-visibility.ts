/**
 * Which sponsor lines a visitor is allowed to see.
 *
 * Test and real sponsorships share one table, and a signed-in sponsor can read
 * their own row before it is approved. So every render filters here too —
 * a test line, or a line you haven't approved, must never reach the live site.
 */
export type SponsorVisibilityRow = {
  id: string;
  name: string;
  url: string;
  tagline: string | null;
  approved: boolean;
  active: boolean;
  paid: boolean;
  environment: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

export function visibleSponsors<T extends SponsorVisibilityRow>(
  rows: readonly T[],
  environment: string,
  now: Date = new Date(),
): T[] {
  const iso = now.toISOString();
  return rows.filter(
    (row) =>
      row.approved === true &&
      row.active === true &&
      row.paid === true &&
      row.environment === environment &&
      (!row.starts_at || row.starts_at <= iso) &&
      (!row.ends_at || row.ends_at > iso),
  );
}

/** Sponsors featured on a page for `region` ("uk" or a country code): site-wide ones plus that region's own. */
export function sponsorsForRegion<T extends { region?: string | null }>(rows: readonly T[], region: string): T[] {
  return rows.filter((r) => !r.region || r.region === "all" || r.region === region);
}

/** Region of a page from its path: a known country code as first segment, otherwise the UK register. */
export function regionFromPath(pathname: string, countryCodes: readonly string[]): string {
  const first = pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
  return countryCodes.includes(first) ? first : "uk";
}

/** The `size` sponsors shown at rotation step `tick`, wrapping round the list. */
export function rotationWindow<T>(rows: readonly T[], tick: number, size: number): T[] {
  if (rows.length <= size) return [...rows];
  const start = (tick * size) % rows.length;
  return Array.from({ length: size }, (_, i) => rows[(start + i) % rows.length] as T);
}

/** Fair rotation order: everyone gets equal turns; a random starting point per visit means nobody is always first. */
export function fairOrder<T>(rows: readonly T[], seed: number): T[] {
  if (rows.length === 0) return [];
  const start = Math.abs(Math.floor(seed)) % rows.length;
  return [...rows.slice(start), ...rows.slice(0, start)];
}
