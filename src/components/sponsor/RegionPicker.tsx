import { useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import { REGION_GROUPS, reachSummary } from "@/lib/sponsor-regions";

/** Worldwide, groups and individual countries; submits one hidden "regions" field per choice. */
export function RegionPicker({ initial }: { initial: string[] }) {
  const [picked, setPicked] = useState<string[]>(initial.length ? initial : ["all"]);
  const world = picked.includes("all");
  const toggle = (v: string) =>
    setPicked((p) => {
      const rest = p.filter((x) => x !== "all");
      const next = rest.includes(v) ? rest.filter((x) => x !== v) : [...rest, v];
      return next.length ? next : ["all"];
    });
  const box = "flex items-center gap-2 text-xs";
  return (
    <fieldset className="text-sm sm:col-span-2">
      <legend className="font-medium">Where to feature you</legend>
      {picked.map((r) => <input key={r} type="hidden" name="regions" value={r} />)}
      <label className={`${box} mt-2`}>
        <input type="checkbox" checked={world} onChange={() => setPicked(["all"])} /> Worldwide — every page
      </label>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Regions</p>
      <div className="mt-1 grid gap-1 sm:grid-cols-2">
        {REGION_GROUPS.map((g) => (
          <label key={g.id} className={box}><input type="checkbox" checked={picked.includes(g.id)} onChange={() => toggle(g.id)} /> {g.label}</label>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Or pick countries</p>
      <div className="mt-1 grid max-h-48 gap-1 overflow-y-auto sm:grid-cols-3">
        {[{ code: "uk", name: "United Kingdom" }, ...COUNTRIES].map((c) => (
          <label key={c.code} className={box}><input type="checkbox" checked={picked.includes(c.code)} onChange={() => toggle(c.code)} /> {c.name}</label>
        ))}
      </div>
      <p className="mt-3 text-xs text-electric-soft">You'll appear on: <strong>{reachSummary(picked)}</strong>, sharing equal turns with other sponsors there.</p>
    </fieldset>
  );
}
