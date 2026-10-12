import { useState } from "react";
import { BANNER_REQUIREMENTS } from "@/lib/banner-image";

const EXAMPLES = {
  local: { name: "Harbour & Hale Estate Agents", tagline: "Local property experts since 2009", reach: "United Kingdom pages only" },
  global: { name: "Northmark Logistics", tagline: "Freight across Europe and North America", reach: "Europe + North America — 33 country pages" },
};

/** Static, clearly-labelled example of the footer sponsor line. Never reads real sponsors. */
export function SponsorPreview() {
  const [plan, setPlan] = useState<"supporter" | "sponsor">("sponsor");
  const [kind, setKind] = useState<"local" | "global">("local");
  const EXAMPLE = EXAMPLES[kind];
  const isSponsor = plan === "sponsor";
  return (
    <section className="mt-10 rounded-md border border-dashed border-electric/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-block rounded-sm bg-ageing/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ageing">
            Example — not a real sponsor
          </span>
          <h2 className="mt-2 font-display text-xl font-semibold">See what you get</h2>
        </div>
        <div role="group" aria-label="Plan preview" className="flex rounded-sm border border-night-line font-mono text-xs">
          {(["supporter", "sponsor"] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={plan === p}
              onClick={() => setPlan(p)}
              className={`px-3 py-1.5 ${plan === p ? "bg-electric text-night" : "text-night-muted"}`}
            >
              {p === "supporter" ? "Supporter £5" : "Sponsor £10"}
            </button>
          ))}
        </div>
      </div>

      <div role="group" aria-label="Business type" className="mt-3 flex w-fit rounded-sm border border-night-line font-mono text-xs">
        {(["local", "global"] as const).map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`px-3 py-1.5 ${kind === k ? "bg-electric text-night" : "text-night-muted"}`}>
            {k === "local" ? "Local business" : "Global / regional firm"}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-night-muted">How your line looks on the pages you choose. This example appears on: <strong className="text-foreground">{EXAMPLE.reach}</strong>.</p>

      <div className="mt-4 rounded-sm border border-night-line bg-night p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-night-muted">
          <span className="uppercase tracking-[0.18em]">Supported by</span>
          <span className="rounded-sm px-1 text-electric-soft ring-1 ring-electric/60">
            {EXAMPLE.name}
            {isSponsor && <span className="text-foreground"> — {EXAMPLE.tagline}</span>}
          </span>
          {!isSponsor && <span>Other supporter</span>}
          <span aria-hidden="true">·</span>
          <span>Sponsors never see or influence figures</span>
        </div>
      </div>

      <ul className="mt-4 grid gap-2 font-mono text-xs text-night-muted sm:grid-cols-2">
        <li>→ Your name, linking to your website</li>
        <li>→ Pick worldwide, a region (Europe, EU, North America, English-speaking) or any mix of countries</li>
        <li className={isSponsor ? "" : "opacity-50"}>→ Your tagline (Sponsor only)</li>
        <li className={isSponsor ? "" : "opacity-50"}>
          → {isSponsor ? "Shown first, before supporters" : "Rotates with other supporters"}
        </li>
        <li className={isSponsor ? "" : "opacity-50"}>
          → {isSponsor ? `Your banner picture: ${BANNER_REQUIREMENTS}` : "Your own banner picture (Sponsor only)"}
        </li>
      </ul>

      <p className="mt-4 text-xs text-night-muted">
        Where you won't appear: next to figures, in embeds or widgets, or on share images. That separation is what
        keeps the numbers trusted, and it's what you're putting your name to.
      </p>
    </section>
  );
}
