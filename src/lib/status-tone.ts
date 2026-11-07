import type { AlertTone, Metric } from "@/lib/uk-stats";
import { freshnessOf } from "@/lib/uk-stats";

export type BlockTone = "red" | "amber" | "yellow" | "green" | "plain";

/** Block colour for a home tile, taken only from the publisher's own level or the figure's freshness. */
export function statusTone(m: Metric | undefined, now = Date.now()): BlockTone {
  if (!m || m.value == null) return "plain";
  const s = m.scale;
  if (s) {
    if (s.current == null) return "plain";
    const t: AlertTone | undefined = s.steps[s.current]?.tone;
    if (t === "red" || t === "crimson") return "red";
    if (t === "amber") return "amber";
    if (t === "yellow") return "yellow";
    if (t === "green") return "green";
    return "plain";
  }
  const f = freshnessOf(m, now);
  return f === "fresh" ? "green" : f === "ageing" ? "amber" : f === "overdue" ? "red" : "plain";
}
