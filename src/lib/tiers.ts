// Duration tiers for shareable live pages. Edit pricing/durations here only.

export interface Tier {
  id: string;
  label: string;
  price: string;
  pricePence: number;
  hours: number;
  blurb: string;
}

export const TIERS: Tier[] = [
  { id: "preview", label: "Free preview", price: "£0", pricePence: 0, hours: 1, blurb: "60 minutes, no payment" },
  { id: "day", label: "24 hours", price: "£1", pricePence: 100, hours: 24, blurb: "One-off share" },
  { id: "week", label: "1 week", price: "£5", pricePence: 500, hours: 24 * 7, blurb: "Campaign or thread" },
  { id: "month", label: "1 month", price: "£15", pricePence: 1500, hours: 24 * 30, blurb: "Newsletter or blog embed" },
  { id: "sixmonths", label: "6 months", price: "£40", pricePence: 4000, hours: 24 * 182, blurb: "Half-year placement" },
  { id: "year", label: "1 year", price: "£70", pricePence: 7000, hours: 24 * 365, blurb: "Annual subscription" },
];

export function tierById(id: string): Tier | undefined {
  return TIERS.find((t) => t.id === id);
}

export function countdown(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "expired";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} min left`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ${mins % 60}m left`;
  const days = Math.floor(hours / 24);
  if (days < 60) return `${days} days left`;
  return `${Math.round(days / 30)} months left`;
}
