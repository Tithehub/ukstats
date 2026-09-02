import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/register", label: "Data" },
  { to: "/maps", label: "Maps" },
  { to: "/tax-vs-welfare", label: "Tax vs welfare" },
  { to: "/widget", label: "Widgets" },
  { to: "/create", label: "Reports" },
  { to: "/my-pages", label: "My pages" },
  { to: "/support", label: "Support" },
] as const;

export function Wordmark() {
  return (
    <Link to="/" className="flex shrink-0 items-baseline gap-0.5 text-lg font-semibold tracking-tight text-night-fg">
      <span className="mr-1.5 inline-flex items-end gap-[2px]" aria-hidden="true">
        <span className="block h-2.5 w-1 rounded-[1px] bg-electric" />
        <span className="block h-4 w-1 rounded-[1px] bg-electric" />
        <span className="block h-3 w-1 rounded-[1px] bg-electric-soft" />
      </span>
      UK<span className="text-electric">Stats</span>
    </Link>
  );
}

/** Site-wide navigation. `status` renders an optional live-feed badge. */
export function SiteHeader({ status }: { status?: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-night-line/60 bg-night/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <Wordmark />
          <nav aria-label="Primary" className="hidden items-center gap-5 font-mono text-[12px] text-night-muted md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "text-night-fg" }}
                className="rounded-sm transition-colors hover:text-electric-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-electric"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {status ? (
            <span className="hidden items-center gap-2 rounded-full border border-night-line/70 px-3 py-1.5 font-mono text-[11px] text-night-muted lg:inline-flex">
              {status}
            </span>
          ) : null}
          <ThemeToggle />
          <Link
            to="/create"
            className="hidden rounded-md bg-electric px-3 py-2 text-[12px] font-medium text-night transition-opacity hover:opacity-90 sm:block"
          >
            Create live page
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation"
            className="grid size-9 place-items-center rounded-md border border-night-line/70 text-night-muted md:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <nav aria-label="Mobile" className="border-t border-night-line/60 bg-night px-4 py-3 md:hidden">
          <ul className="grid gap-1 font-mono text-[13px]">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: n.to === "/" }}
                  activeProps={{ className: "text-night-fg" }}
                  className="block rounded-md px-2 py-2 text-night-muted hover:bg-night-panel"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
