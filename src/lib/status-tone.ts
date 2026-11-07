import type { Metric } from "@/lib/uk-stats";

export type BlockTone = "red" | "yellow" | "plain";

/** Block colour for a home tile: only an official red or yellow warning level is coloured; everything else stays plain. */
export function statusTone(m: Metric | undefined): BlockTone {
  const s = m?.scale;
  if (!m || m.value == null || !s || s.current == null) return "plain";
  const t = s.steps[s.current]?.tone;
  if (t === "red" || t === "crimson") return "red";
  if (t === "yellow") return "yellow";
  return "plain";
}
