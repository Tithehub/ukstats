import { Link } from "@tanstack/react-router";

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
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Data</p>
          <ul className="mt-3 space-y-2 text-[13px]">
            <li>
              <Link to="/register" className="text-night-muted hover:text-electric-soft">
                Full register
              </Link>
            </li>
            <li>
              <Link to="/widget" className="text-night-muted hover:text-electric-soft">
                Widget builder
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Insights</p>
          <ul className="mt-3 space-y-2 text-[13px]">
            <li>
              <Link to="/create" className="text-night-muted hover:text-electric-soft">
                Create a live page
              </Link>
            </li>
            <li>
              <Link to="/my-pages" className="text-night-muted hover:text-electric-soft">
                My pages
              </Link>
            </li>
          </ul>
        </div>
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
