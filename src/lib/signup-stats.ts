/** London calendar day (YYYY-MM-DD) for an instant. */
export function londonDay(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Count sign-ups per London day for the `days` days ending on `now`'s London day (oldest first). */
export function bucketByLondonDay(createdAt: string[], now: Date, days = 30): { day: string; count: number }[] {
  const out: { day: string; count: number }[] = [];
  const seen = new Set<string>();
  for (let i = days - 1; i >= 0; i--) {
    const day = londonDay(new Date(now.getTime() - i * 86_400_000));
    if (!seen.has(day)) { seen.add(day); out.push({ day, count: 0 }); }
  }
  const idx = new Map(out.map((b, i) => [b.day, i]));
  for (const c of createdAt) {
    const i = idx.get(londonDay(new Date(c)));
    const b = i === undefined ? undefined : out[i]; if (b) b.count++;
  }
  return out;
}
