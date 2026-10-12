import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { COUNTRIES } from "@/lib/countries";
import { fairOrder, regionFromPath, sponsorsForRegion, visibleSponsors, type SponsorVisibilityRow } from "@/lib/sponsor-visibility";
import { getSponsorBannerLinks } from "@/lib/banner.functions";
import exampleBanner from "@/assets/sponsor-example-estate-agent.jpg";

export const ROTATE_SECONDS = 8;
type Row = SponsorVisibilityRow & { region: string | null; plan: string | null; banner_url: string | null; banner_path: string | null };

/** Rotating sponsor banner (one at a time, equal turns). Home page under the hero ("hero") or footer zone elsewhere ("footer") — never near figures, embeds, widgets or share images. */
export function SponsorBanner({ variant = "footer" }: { variant?: "footer" | "hero" }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const region = regionFromPath(pathname, COUNTRIES.map((c) => c.code));
  const links = useServerFn(getSponsorBannerLinks);
  const [rows, setRows] = useState<Row[]>([]);
  const [bannerLinks, setBannerLinks] = useState<Record<string, string>>({});
  const [seed, setSeed] = useState(0);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setSeed(Math.floor(Math.random() * 1e6));
    let env: string;
    try { env = getStripeEnvironment(); } catch { return; }
    supabase
      .from("sponsors")
      .select("id,name,url,tagline,approved,active,paid,environment,starts_at,ends_at,region,plan,banner_url,banner_path")
      .then(({ data }) => setRows(visibleSponsors((data ?? []) as Row[], env)));
    links({ data: { environment: env } })
      .then((r) => setBannerLinks(Object.fromEntries(r.links.map((l) => [l.id, l.url] as const))))
      .catch(() => {});
  }, []);

  const order = fairOrder(sponsorsForRegion(rows, region), seed);
  useEffect(() => {
    if (paused || order.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setTick((t) => t + 1), ROTATE_SECONDS * 1000);
    return () => clearInterval(id);
  }, [paused, order.length]);

  const current = order.length ? order[tick % order.length] : null;
  const currentImage = current
    ? current.banner_path
      ? bannerLinks[current.id] ?? null
      : current.banner_url
    : null;

  return (
    <section
      aria-label="Our sponsors"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="border-b border-night-line/50 bg-night"
    >
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">
          <span>Thanks to our sponsors</span>
          <Link to="/sponsors" className="hover:text-electric-soft">All sponsors →</Link>
        </div>
        {current ? (
          <BannerCard
            key={current.id}
            image={currentImage}
            name={current.name}
            tagline={current.tagline}
            cta={`Visit ${current.name}`}
            href={current.url}
            external
          />
        ) : (
          <BannerCard
            image={exampleBanner}
            name="Harbour & Hale Estate Agents"
            tagline="Local property experts since 2009"
            cta="Your business here — from £5/month"
            href="/advertise"
            example
          />
        )}
        {order.length > 1 ? (
          <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
            {order.map((s, i) => (
              <span key={s.id} className={`h-1 w-6 rounded-full ${i === tick % order.length ? "bg-electric" : "bg-night-line"}`} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function BannerCard(props: { image: string | null; name: string; tagline: string | null; cta: string; href: string; external?: boolean; example?: boolean }) {
  const words = (
    <>
      {props.example ? (
        <span className="w-fit rounded-sm bg-ageing/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ageing">Example sponsor</span>
      ) : (
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Sponsor</span>
      )}
      <p className="text-lg font-semibold sm:text-xl">{props.name}</p>
      {props.tagline ? <p className="text-sm text-night-muted">{props.tagline}</p> : null}
      <span className="mt-2 w-fit rounded-md bg-electric px-4 py-2 text-sm font-medium text-night">{props.cta}</span>
    </>
  );
  const body = (
    <div className="mx-auto flex max-w-[980px] flex-col overflow-hidden rounded-lg border border-night-line bg-night-panel animate-in fade-in duration-700 sm:flex-row sm:items-center">
      {/* On a phone the words sit under the picture; on a larger screen they sit beside it. */}
      <div className="order-2 flex w-full shrink-0 flex-col justify-center gap-1 p-4 sm:order-1 sm:w-[300px] sm:p-6">{words}</div>
      {/* The picture keeps its true 3:1 shape at every screen size, so none of it is ever cropped away. */}
      <div className="relative order-1 aspect-[3/1] w-full sm:order-2 sm:flex-1">
        {props.image ? (
          <img src={props.image} alt="" loading="lazy" width={1536} height={512} className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
      </div>
    </div>
  );
  return props.external ? (
    <a href={props.href} target="_blank" rel="sponsored noopener noreferrer" className="block">{body}</a>
  ) : (
    <Link to="/advertise" className="block">{body}</Link>
  );
}
