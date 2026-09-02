import { useMemo, useState } from "react";
import type { HistoryPoint } from "@/lib/uk-stats";

const RANGES = ["1Y", "5Y", "10Y", "Max"] as const;
type Range = (typeof RANGES)[number];

/** Observations per year, read from the publisher's own period labels. */
function perYear(points: HistoryPoint[]): number {
  const l = points[points.length - 1]?.label ?? "";
  if (/Q[1-4]/i.test(l)) return 4;
  if (/[A-Z]{3}/.test(l)) return 12;
  return 1;
}

export function HistoryChart({
  points,
  unit,
  height = 260,
}: {
  points: HistoryPoint[];
  unit?: string;
  height?: number;
}) {
  const [range, setRange] = useState<Range>("10Y");
  const [hover, setHover] = useState<number | null>(null);
  const py = perYear(points);

  const shown = useMemo(() => {
    if (range === "Max") return points;
    const years = range === "1Y" ? 1 : range === "5Y" ? 5 : 10;
    return points.slice(-Math.max(2, years * py));
  }, [points, range, py]);

  if (shown.length < 2) return <p className="font-mono text-[11px] text-night-muted">Not enough published observations to draw a chart.</p>;

  const w = 720;
  const h = height;
  const padL = 48;
  const padB = 26;
  const padT = 12;
  const values = shown.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => padL + (i / (shown.length - 1)) * (w - padL - 8);
  const y = (v: number) => padT + (1 - (v - min) / span) * (h - padT - padB);
  const d = shown.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${d} L${x(shown.length - 1).toFixed(1)},${h - padB} L${padL},${h - padB} Z`;
  const ticks = [max, min + span / 2, min];
  const active = hover == null ? null : shown[Math.min(hover, shown.length - 1)];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors ${
                range === r ? "bg-electric text-night" : "text-night-muted hover:bg-night-panel"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <p className="font-mono text-[10px] text-night-muted">
          {shown[0]!.label} – {shown[shown.length - 1]!.label} · {shown.length} published observations
          {unit ? ` · ${unit}` : ""}
        </p>
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        role="img"
        aria-label={`Published series from ${shown[0]!.label} to ${shown[shown.length - 1]!.label}`}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(ev) => {
          const box = ev.currentTarget.getBoundingClientRect();
          const rel = ((ev.clientX - box.left) / box.width) * w;
          const i = Math.round(((rel - padL) / (w - padL - 8)) * (shown.length - 1));
          setHover(Math.max(0, Math.min(shown.length - 1, i)));
        }}
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={w - 8} y1={y(t)} y2={y(t)} stroke="var(--night-line)" strokeWidth="1" />
            <text x={4} y={y(t) + 3} className="fill-night-muted" style={{ fontSize: 10, fontFamily: "monospace" }}>
              {t.toLocaleString("en-GB", { maximumFractionDigits: 1 })}
            </text>
          </g>
        ))}
        <path d={area} fill="var(--electric)" opacity="0.10" />
        <path d={d} fill="none" stroke="var(--electric)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
        {hover != null && active ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={h - padB} stroke="var(--electric)" strokeWidth="1" opacity="0.5" />
            <circle cx={x(hover)} cy={y(active.value)} r="3.5" fill="var(--electric)" />
          </g>
        ) : null}
        <text x={padL} y={h - 8} className="fill-night-muted" style={{ fontSize: 10, fontFamily: "monospace" }}>
          {shown[0]!.label}
        </text>
        <text
          x={w - 8}
          y={h - 8}
          textAnchor="end"
          className="fill-night-muted"
          style={{ fontSize: 10, fontFamily: "monospace" }}
        >
          {shown[shown.length - 1]!.label}
        </text>
      </svg>

      <p className="mt-1 font-mono text-[11px] text-night-muted">
        {active ? (
          <>
            <span className="text-night-fg">{active.label}</span> · {active.formatted}
          </>
        ) : (
          "Hover the chart to read an exact published value."
        )}
      </p>
    </div>
  );
}
