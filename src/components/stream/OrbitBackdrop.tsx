/** Decorative orbit backdrop matching the 32s concept video: tilted orbit rings with red streaks, twinkling lights, ambient pulses. No data. */
const STARS = Array.from({ length: 50 }, (_, i) => ({ x: (i * 137.5) % 100, y: (i * 61.8) % 100, d: (i % 7) * 0.6, s: 1 + (i % 2) }));

export function OrbitBackdrop() {
  return <div aria-hidden className="pointer-events-none absolute inset-0 z-[11] overflow-hidden">
    {STARS.map((p, i) => <span key={i} className="absolute rounded-full bg-electric-soft/60 motion-safe:animate-[orbit-twinkle_3.2s_ease-in-out_infinite]"
      style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, animationDelay: `${p.d}s` }} />)}
    <svg viewBox="0 0 1920 1080" className="absolute inset-0 h-full w-full">
      {[{ rx: 760, ry: 210, r: -12, t: 14 }, { rx: 640, ry: 300, r: 18, t: 19 }, { rx: 880, ry: 150, r: 4, t: 24 }].map((o, i) => (
        <g key={i} transform={`translate(1010 540) rotate(${o.r})`}>
          <ellipse rx={o.rx} ry={o.ry} fill="none" className="stroke-electric/15" strokeWidth={1} />
          <ellipse rx={o.rx} ry={o.ry} fill="none" className="stroke-destructive" strokeWidth={4} strokeLinecap="round" pathLength={100}
            style={{ strokeDasharray: "8 92", animation: `orbit-streak ${o.t}s linear infinite`, filter: "drop-shadow(0 0 8px var(--destructive))" }} />
        </g>
      ))}
    </svg>
  </div>;
}
