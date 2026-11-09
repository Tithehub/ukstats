/** Decorative orbit backdrop matching the 32s concept video: tilted orbit rings with red streaks, twinkling lights, ambient pulses. No data. */
const STARS = Array.from({ length: 70 }, (_, i) => ({ x: (i * 137.5) % 100, y: (i * 61.8) % 100, d: (i % 7) * 0.6, s: 1 + (i % 3) }));

export function OrbitBackdrop() {
  return <div aria-hidden className="pointer-events-none absolute inset-0 z-[11] overflow-hidden">
    {STARS.map((p, i) => <span key={i} className="absolute rounded-full bg-stream-yellow/80"
      style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s * 2, height: p.s * 2, animation: `orbit-twinkle 3.2s ease-in-out ${p.d}s infinite` }} />)}
    <svg viewBox="0 0 1920 1080" className="absolute inset-0 h-full w-full">
      {[{ rx: 760, ry: 210, r: -12, t: 14 }, { rx: 640, ry: 300, r: 18, t: 19 }, { rx: 880, ry: 150, r: 4, t: 24 }].map((o, i) => (
        <g key={i} transform={`translate(1010 540) rotate(${o.r})`}>
          <ellipse rx={o.rx} ry={o.ry} fill="none" className="stroke-electric/25" strokeWidth={1.5} />
          <ellipse rx={o.rx} ry={o.ry} fill="none" className="stroke-destructive" strokeWidth={4} strokeLinecap="round" pathLength={100}
            style={{ strokeDasharray: "8 92", animation: `orbit-streak ${o.t}s linear infinite`, filter: "drop-shadow(0 0 8px var(--destructive))" }} />
        </g>
      ))}
    </svg>
    {[{ l: "30%", t: "70%", d: 0 }, { l: "78%", t: "28%", d: 1.7 }, { l: "62%", t: "80%", d: 3.1 }].map((p, i) => (
      <span key={i} className="absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-destructive/70"
        style={{ left: p.l, top: p.t, animation: `orbit-ring 4.5s ease-out ${p.d}s infinite` }} />
    ))}
  </div>;
}
