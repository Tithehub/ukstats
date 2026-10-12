import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { COUNTRIES } from "@/lib/countries";
import { regionFromPath, rotationWindow, sponsorsForRegion, visibleSponsors, type SponsorVisibilityRow } from "@/lib/sponsor-visibility";

export const ROTATE_SECONDS = 8;
const PER_VIEW = 3;
type Row = SponsorVisibilityRow & { region: string | null; plan: string | null };

/** Rotating "Thanks to our sponsors" band. Footer/hub zone only — never inside figure cards, embeds, widgets or share images. */
export function SponsorBanner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const region = regionFromPath(pathname, COUNTRIES.map((c) => c.code));
  const [rows, setRows] = useState<Row[]>([]);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let env: string;
    try { env = getStripeEnvironment(); } catch { return; }
    supabase
      .from("sponsors")
      .select("id,name,url,tagline,approved,active,paid,environment,starts_at,ends_at,region,plan")
      .order("plan", { ascending: true, nullsFirst: false })
      .then(({ data }) => setRows(visibleSponsors((data ?? []) as Row[], env)));
  }, []);

  const local = sponsorsForRegion(rows, region);
  useEffect(() => {
    if (paused || local.length <= PER_VIEW) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setTick((t) => t + 1), ROTATE_SECONDS * 1000);
    return () => clearInterval(id);
  }, [paused, local.length]);

  const shown = rotationWindow(local, tick, PER_VIEW);
  return (
    <section
      aria-label="Our sponsors"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="border-b border-night-line/50 bg-night"
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">
          Thanks to our sponsors
        </p>
        {shown.length === 0 ? (
          <Link to="/advertise" className="text-sm text-electric-soft hover:underline">
            Your business here — sponsor UKStats from £5/month
          </Link>
        ) : (
          <ul aria-live="polite" className="grid flex-1 gap-3 sm:grid-cols-3">
            {shown.map((s) => (
              <li key={s.id} className="rounded-md border border-night-line bg-night-panel/60 px-3 py-2 animate-in fade-in duration-500">
                <a href={s.url} target="_blank" rel="sponsored noopener noreferrer" className="block hover:text-electric-soft">
                  <span className="text-sm font-semibold">{s.name}</span>
                  {s.tagline ? <span className="block text-xs text-night-muted">{s.tagline}</span> : null}
                </a>
              </li>
            ))}
          </ul>
        )}
        <Link to="/sponsors" className="font-mono text-[11px] text-night-muted hover:text-electric-soft">All sponsors →</Link>
      </div>
    </section>
  );
}
