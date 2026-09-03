// Live shareable pages are free. Anonymous pages get a long window that the
// owner can renew with one click; there is no pricing and no payment step.

export const DEFAULT_PAGE_HOURS = 24 * 365;

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
