// Pure helpers for the "orbit" broadcast layout. Never creates figures: it only picks a scene
// for an existing segment and animates the formatting of an already-published value.
import type { Segment } from "./stream-rundown";

export type OrbitScene = "stats" | "headlines" | "weather" | "warnings" | "migration" | "flights" | "world";

export function sceneFor(seg: Segment | undefined): OrbitScene {
  if (!seg) return "stats";
  if (seg.id === "warnings") return "warnings";
  if (seg.id === "news") return "headlines";
  if (seg.id === "weather") return "weather";
  if (seg.id === "flights") return "flights";
  if (seg.id === "boats" || seg.id === "legal") return "migration";
  if (seg.id.startsWith("country-")) return "world";
  return seg.cards.length ? "stats" : "headlines";
}

const NUM = /\d[\d,]*(?:\.\d+)?/;

/** Value shown at progress p (0–1). At p >= 1 — or if no number is found — returns the published string exactly. */
export function countUp(value: string, p: number): string {
  if (p >= 1) return value;
  const m = value.match(NUM);
  if (!m) return value;
  const raw = m[0];
  const target = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(target)) return value;
  const decimals = raw.includes(".") ? raw.split(".")[1]!.length : 0;
  const eased = 1 - Math.pow(1 - Math.max(0, p), 3);
  const n = target * eased;
  const s = raw.includes(",")
    ? n.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : n.toFixed(decimals);
  return value.slice(0, m.index) + s + value.slice(m.index! + raw.length);
}
