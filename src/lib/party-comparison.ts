export type ElectionParty = {
  id: string;
  name: string;
  seats: number;
  voteShare: number;
  area: string;
};

export type PartyTopic = "immigration" | "tax" | "nhs" | "housing" | "climate";
export const PARTY_TOPICS: { id: PartyTopic; label: string }[] = [
  { id: "immigration", label: "Immigration" },
  { id: "tax", label: "Tax" },
  { id: "nhs", label: "NHS" },
  { id: "housing", label: "Housing" },
  { id: "climate", label: "Climate" },
];

/** Competition ranks: ties share a position; never silently break them by name. */
export function rankParties<T>(rows: T[], value: (row: T) => number) {
  const ordered = [...rows].sort((a, b) => value(b) - value(a));
  let rank = 0;
  return ordered.map((party, index) => {
    const previous = ordered[index - 1];
    if (!previous || value(previous) !== value(party)) rank = index + 1;
    return { party, rank };
  });
}

type PublishedPoll = {
  pollster: string;
  url: string;
  fieldworkEnd: string | null;
  sampleSize: number | null;
  shares: Record<string, number>;
  error?: string | null;
};

/** A poll remains its own comparison: no invented pooled or modelled figure. */
export function recentPartyPolls<T extends PublishedPoll>(polls: T[], now: number, windowDays: number): T[] {
  return polls.filter(poll => {
    const end = poll.fieldworkEnd ? Date.parse(poll.fieldworkEnd) : NaN;
    return !poll.error && Number.isFinite(end) && end <= now &&
      end >= now - windowDays * 86_400_000 && Object.values(poll.shares).some(Number.isFinite);
  });
}

/** SNP/Plaid national totals are not ranked against GB headline voting intention. */
export function rankHeadlinePoll(shares: Record<string, number>) {
  const comparable = ["Labour", "Conservative", "Reform UK", "Liberal Democrats", "Green Party"];
  return rankParties(
    Object.entries(shares).filter(([party, share]) => comparable.includes(party) && Number.isFinite(share))
      .map(([name, share]) => ({ name, share })),
    row => row.share,
  );
}