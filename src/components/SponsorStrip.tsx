import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Sponsor = { id: string; name: string; url: string; tagline: string | null };

/** Clearly-labelled sponsor line. Never render inside figure cards, embeds, widgets or share images. */
export function SponsorStrip({ placement = "footer" }: { placement?: string }) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  useEffect(() => {
    const now = new Date().toISOString();
    supabase
      .from("sponsors")
      .select("id,name,url,tagline,starts_at,ends_at")
      .eq("placement", placement)
      .order("plan", { ascending: true, nullsFirst: false })
      .then(({ data }) =>
        setSponsors(
          (data ?? []).filter(
            (s) => (!s.starts_at || s.starts_at <= now) && (!s.ends_at || s.ends_at > now),
          ),
        ),
      );
  }, [placement]);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-night-muted">
      <span className="uppercase tracking-[0.18em]">Supported by</span>
      {sponsors.length === 0 ? (
        <Link to="/advertise" className="hover:text-electric-soft">Your organisation? Sponsor UKStats</Link>
      ) : (
        sponsors.map((s) => (
          <a key={s.id} href={s.url} target="_blank" rel="sponsored noopener noreferrer" className="hover:text-electric-soft">
            {s.name}{s.tagline ? ` — ${s.tagline}` : ""}
          </a>
        ))
      )}
      <span aria-hidden="true">·</span>
      <span>Sponsors never see or influence figures</span>
    </div>
  );
}
