import { useEffect } from "react";
import { Flag, Flame, Plane, Rocket, Sailboat, Swords, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NO_FIGURE, UK_ALERT_COLOURS, US_LEVEL_COLOURS, shadeColour } from "@/lib/globe-legend";
import { FCDO_ALERT_LABEL, US_LEVEL_LABEL, type FcdoAlert } from "@/lib/unrest";

// Plain colours mirroring EarthGlobe's WebGL values, so this key and the globe always agree.
const KIND_C = { riot: "#e0452f", protest: "#f0a020", strike: "#ff2a1a", war: "#9a1b1b" } as const;
const HOT_C = "rgba(214,72,52,0.85)";
const FLOW_C = { frontex: "#f0a020", cbp: "#ff4a3a", unhcr: "#7fb2ff" } as const;

function Swatch({ c, kind }: { c: string; kind?: string }) {
  return kind === "dot"
    ? <span aria-hidden="true" className="mr-1.5 inline-block size-2.5 rounded-full align-middle" style={{ background: c }} />
    : <span aria-hidden="true" className="mr-1.5 inline-block size-2.5 shrink-0 rounded-sm align-middle" style={{ background: c }} />;
}

function IconRow({ icon: Icon, c, children }: { icon: typeof Flag; c: string; children: React.ReactNode }) {
  return <li className="flex items-start gap-1.5"><Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" style={{ color: c }} /><span>{children}</span></li>;
}

/** One panel listing every colour and icon the globe can draw, always agreeing with the WebGL values. */
export function GlobeKey({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div id="globe-key" role="dialog" aria-label="Globe key — colours and icons"
    className="z-40 overflow-y-auto border border-night-line bg-night-panel p-3 text-xs shadow-2xl max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[55dvh] max-sm:rounded-t-xl sm:absolute sm:left-3 sm:top-16 sm:max-h-[70%] sm:w-80 sm:rounded-md sm:bg-night-panel/95 sm:backdrop-blur">
    <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Key — colours &amp; icons</h2><Button variant="ghost" size="icon" aria-label="Close key" onClick={onClose}><X className="size-4" /></Button></div>

    <h3 className="mt-3 font-semibold">Country colours</h3>
    <ul className="mt-1 space-y-1 text-night-muted">
      <li className="flex items-start gap-1.5"><span aria-hidden="true" className="mt-1 inline-block h-2 w-8 shrink-0 rounded-sm" style={{ background: `linear-gradient(to right, ${shadeColour(0)}, ${shadeColour(0.5)}, ${shadeColour(1)})` }} /><span><b className="text-night-fg">Blue → red</b> when "Colour by" is a statistic: blue = lowest rank, red = rank 1.</span></li>
      <li><Swatch c={NO_FIGURE} /><b className="text-night-fg">Grey</b>: no recent official figure, or too old to rank.</li>
      <li><Swatch c="rgba(214,72,52,0.85)" /><b className="text-night-fg">Red glow</b>: official UK/US advice mentions unrest there in the last 30 days.</li>
      <li><Swatch c="#f2f6ff" /><b className="text-night-fg">White</b>: the country you have open.</li>
    </ul>
    <ul className="mt-1 space-y-0.5 text-night-muted" aria-label="US advice colours">
      <li className="pt-1 font-semibold text-night-fg">US travel-advice levels (Layers → Colour by)</li>
      {[1, 2, 3, 4].map((l) => <li key={l}><Swatch c={US_LEVEL_COLOURS[l]!} />Level {l} · {US_LEVEL_LABEL[l]}</li>)}
      <li><Swatch c={NO_FIGURE} />Grey: no US advisory on file.</li>
    </ul>
    <ul className="mt-1 space-y-0.5 text-night-muted" aria-label="FCDO advice colours">
      <li className="pt-1 font-semibold text-night-fg">UK FCDO advice against travel (Layers → Colour by)</li>
      {(["all", "all-but-essential", "parts-all", "parts-essential", "none"] as FcdoAlert[]).map((a) => <li key={a}><Swatch c={UK_ALERT_COLOURS[a]} />{FCDO_ALERT_LABEL[a]}</li>)}
      <li><Swatch c={NO_FIGURE} />Grey: not yet checked this cycle.</li>
    </ul>

    <h3 className="mt-3 font-semibold">Warning &amp; report icons</h3>
    <ul className="mt-1 space-y-1">
      <IconRow icon={Flag} c={KIND_C.protest}><b style={{ color: KIND_C.protest }}>Protest</b> — amber placard on a pole, pulsing amber ring. Official advice mentions protests.</IconRow>
      <IconRow icon={Flame} c={KIND_C.riot}><b style={{ color: KIND_C.riot }}>Riot</b> — red flare with a fiery core, red ring. Official advice mentions riots.</IconRow>
      <IconRow icon={Rocket} c={KIND_C.strike}><b style={{ color: KIND_C.strike }}>Military strike</b> — missile diving onto a golden burst. Advice mentions strikes, missiles, drones or shelling.</IconRow>
      <IconRow icon={Swords} c={KIND_C.war}><b style={{ color: KIND_C.war }}>War / armed conflict</b> — crossed swords on a dark-red shield, widest ring. Advice mentions war, fighting or military operations.</IconRow>
      <li className="flex items-start gap-1.5 text-night-muted"><span aria-hidden="true" className="mt-0.5 flex gap-0.5"><Flag className="size-3 opacity-40" style={{ color: KIND_C.protest }} /><Flame className="size-3 opacity-40" style={{ color: KIND_C.riot }} /><Rocket className="size-3 opacity-40" style={{ color: KIND_C.strike }} /></span><span><b className="text-night-fg">Faded copies</b> of these icons are research and media reports — ACLED events and news or police headlines — never official warnings.</span></li>
      <li className="text-night-muted">Military wording wins over protest. Icons sit where the advice names a place, or on the capital when it names none (shown with * elsewhere). Click any icon for the government's own words, time and link.</li>
    </ul>

    <h3 className="mt-3 font-semibold">Flights (white plane silhouettes)</h3>
    <ul className="mt-1 space-y-1">
      <IconRow icon={Plane} c="#3fcf7a"><b className="text-fresh">Green</b>: normal.</IconRow>
      <IconRow icon={Plane} c="#f0a020"><b className="text-ageing">Amber</b>: radio-failure squawk, or flying over a US Level 3 / FCDO lower-warning country.</IconRow>
      <IconRow icon={Plane} c="#ff4a3a"><b className="text-overdue">Red</b>: emergency or hijack squawk, or over a US Level 4 / FCDO "advise against all travel" country.</IconRow>
      <li className="text-night-muted">Colour follows the country under the plane right now — the feed has no destinations. Click a plane for altitude, speed, squawk and advice links.</li>
      <li className="flex items-center gap-2 text-night-muted"><span aria-hidden="true" className="inline-block h-0.5 w-8 rounded bg-night-fg" />solid line: recent track <span aria-hidden="true" className="ml-1 inline-block w-8 border-t-2 border-dashed border-night-fg" />dashed: direction ahead, not a route</li>
    </ul>

    <h3 className="mt-3 font-semibold">Small boats &amp; migration arrows</h3>
    <ul className="mt-1 space-y-1">
      <IconRow icon={Sailboat} c="#3fcf7a"><b className="text-fresh">Green dinghy</b>: one boat per boat in the Home Office's daily reports (last 7 days by default). Click for the date and that day's figures; positions across the Channel are illustrative.</IconRow>
      <li><Swatch c={FLOW_C.frontex} /><b className="text-night-fg">Amber arrow</b>: illegal border crossings into the EU (Frontex, 12 months).</li>
      <li><Swatch c={FLOW_C.cbp} /><b className="text-night-fg">Red arrow</b>: encounters at the US southwest border (CBP, latest month).</li>
      <li><Swatch c={FLOW_C.unhcr} /><b className="text-night-fg">Blue arrow</b>: refugees and asylum seekers living abroad (UNHCR, yearly) — people seeking protection, not illegal crossings.</li>
      <li className="text-night-muted">Thicker arrow = more people. Sources are shown side by side and never added together.</li>
    </ul>

    <h3 className="mt-3 font-semibold">Live feed pins &amp; research dots</h3>
    <ul className="mt-1 space-y-1 text-night-muted">
      <li><Swatch c="rgba(255,70,90,0.95)" kind="dot" /><b className="text-night-fg">Red "LIVE" pin</b>: a country with a live broadcast running (media, not official).</li>
      <li><Swatch c="rgba(80,230,255,0.9)" kind="dot" /><b className="text-night-fg">Blue pin</b> with a number: news videos from that country in the last 6 hours.</li>
      <li><Swatch c="#ffb020" kind="dot" /><b className="text-night-fg">Amber dot</b>: an ACLED research event. ACLED is independent research, not a government source.</li>
    </ul>

    <p className="mt-3 border-t border-night-line pt-2 text-night-muted">Every colour here is the same value the globe draws, so the key and the map always match. Turn layers on and off in <b className="text-night-fg">Layers</b>.</p>
  </div>;
}
