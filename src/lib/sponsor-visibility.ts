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
