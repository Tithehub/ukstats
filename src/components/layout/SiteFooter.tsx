import { Link } from "@tanstack/react-router";
import { Bot, Building2, FileText, LayoutGrid, LifeBuoy, LogIn, PlusCircle, Rss, Table2 } from "lucide-react";

const COLUMNS = [
  {
    name: "Data",
    links: [
      { to: "/register", label: "Full register", icon: Table2 },
      { to: "/maps", label: "Heat maps", icon: Building2 },
      { to: "/widget", label: "Widget builder", icon: LayoutGrid },
    ],
  },
  {
    name: "Insights",
    links: [
      { to: "/create", label: "Create a live page", icon: PlusCircle },
      { to: "/my-pages", label: "My pages", icon: FileText },
      { to: "/outreach", label: "Outreach queue", icon: Bot },
      { to: "/support", label: "Support UKStats", icon: LifeBuoy },
      { to: "/auth", label: "Sign in", icon: LogIn },
    ],
  },
] as const;

export function SiteFooter({ fetchedAt }: { fetchedAt?: string | number | null }) {
  return (
    <footer className="border-t border-night-line/60 bg-night-panel/40">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="text-base font-semibold">
            UK<span className="text-electric">Stats</span>
          </p>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-night-muted text-pretty">
            An independent aggregator of official UK statistics. Not a government service. Nothing on this site is
            estimated, modelled or interpolated.
          </p>
          <a
            href="/feed.xml"
            className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md text-[13px] text-night-muted hover:text-electric-soft"
          >
            <Rss className="size-4" aria-hidden="true" />
            New figures feed
          </a>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.name}>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">{c.name}</p>
            <ul className="mt-3 space-y-1 text-[13px]">
              {c.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="inline-flex min-h-9 items-center gap-2 rounded-md text-night-muted hover:text-electric-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
                  >
                    <l.icon className="size-4 shrink-0 opacity-70" aria-hidden="true" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Sources</p>
          <ul className="mt-3 space-y-2 text-[13px] text-night-muted">
            <li>ONS · Home Office</li>
            <li>Police.uk · HM Land Registry</li>
            <li>MOD · MI5 / JTAC · Met Office</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-night-line/50">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-[11px] text-night-muted sm:px-6">
          <span>Every figure sourced · nothing estimated</span>
          {fetchedAt ? <span>Last pull {new Date(fetchedAt).toLocaleString("en-GB")}</span> : null}
        </div>
      </div>
    </footer>
  );
}
