import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  Banknote,
  Bot,
  CalendarDays,
  GitCompareArrows,
  FileText,
  Home,
  LayoutGrid,
  LifeBuoy,
  type LucideIcon,
  Map as MapIcon,
  Menu,
  LogIn,
  LogOut,
  Plane,
  Plug,
  PlusCircle,
  Table2,
  Vote,
  X,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { btn, iconBtn } from "@/lib/ui";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Grouped so the drawer reads by theme rather than as one long list. */
const NAV_GROUPS: { name: string; items: NavItem[] }[] = [
  {
    name: "Data",
    items: [
      { to: "/", label: "Home", icon: Home },
      { to: "/register", label: "Full register", icon: Table2 },
      { to: "/maps", label: "Maps", icon: MapIcon },
      { to: "/daily", label: "Daily statement", icon: CalendarDays },
      { to: "/compare", label: "Compare figures", icon: GitCompareArrows },
      { to: "/calendar", label: "Release calendar", icon: CalendarDays },
      { to: "/status", label: "Feed health", icon: Activity },
    ],
  },
  {
    name: "Analysis",
    items: [
      { to: "/tax-vs-welfare", label: "Tax vs welfare", icon: Banknote },
      { to: "/foreign-aid", label: "Foreign aid", icon: Plane },
      { to: "/polling", label: "Polling", icon: Vote },
      { to: "/governments", label: "Governments", icon: LayoutGrid },
    ],
  },
  {
    name: "Tools",
    items: [
      { to: "/widget", label: "Widgets", icon: LayoutGrid },
      { to: "/create", label: "Create a live page", icon: PlusCircle },
      { to: "/my-pages", label: "My pages", icon: FileText },
      { to: "/outreach", label: "Outreach", icon: Bot },
      { to: "/connections", label: "Connect socials", icon: Plug },
      { to: "/support", label: "Support", icon: LifeBuoy },
    ],
  },
];

/** The few links that stay on the desktop bar; everything else lives in the menu. */
const PRIMARY: NavItem[] = [
  { to: "/register", label: "Data", icon: Table2 },
  { to: "/daily", label: "Daily", icon: CalendarDays },
  { to: "/maps", label: "Maps", icon: MapIcon },

  { to: "/tax-vs-welfare", label: "Tax vs welfare", icon: Banknote },
  { to: "/polling", label: "Polling", icon: Vote },
];

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
  const { signedIn, user } = useAuth();

  // Lock the page behind the drawer and close it on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-night-line/60 bg-night/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <Wordmark />
          <nav aria-label="Primary" className="hidden items-center gap-1 font-mono text-[12px] lg:flex">
            {PRIMARY.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "text-night-fg bg-night-panel" }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-night-muted transition-colors hover:bg-night-panel hover:text-electric-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
              >
                <n.icon className="size-4" aria-hidden="true" />
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {status ? (
            <span className="hidden items-center gap-2 rounded-full border border-night-line/70 px-3 py-1.5 font-mono text-[11px] text-night-muted xl:inline-flex">
              {status}
            </span>
          ) : null}
          <ThemeToggle />
          {signedIn ? (
            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className={btn("ghost", "sm", "max-sm:hidden")}
              title={user?.email ?? undefined}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          ) : (
            <Link to="/auth" className={btn("ghost", "sm", "max-sm:hidden")}>
              <LogIn className="size-4" aria-hidden="true" />
              Sign in
            </Link>
          )}
          <Link to="/create" className={btn("primary", "sm", "max-sm:hidden")}>
            <PlusCircle className="size-4" aria-hidden="true" />
            Create live page
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className={iconBtn()}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open ? (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-[57px] z-30 cursor-default bg-night/70 backdrop-blur-sm"
          />
          <nav
            id="site-menu"
            aria-label="All pages"
            className="relative z-40 max-h-[calc(100dvh-57px)] overflow-y-auto border-t border-night-line/60 bg-night px-4 pb-6 pt-4 sm:px-6"
          >
            <div className="mx-auto grid max-w-[1280px] gap-6 sm:grid-cols-3">
              {NAV_GROUPS.map((g) => (
                <div key={g.name}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-electric">{g.name}</p>
                  <ul className="mt-2 grid gap-0.5">
                    {g.items.map((n) => (
                      <li key={n.to}>
                        <Link
                          to={n.to}
                          onClick={() => setOpen(false)}
                          activeOptions={{ exact: n.to === "/" }}
                          activeProps={{ className: "text-night-fg bg-night-panel" }}
                          className="flex min-h-11 items-center gap-2.5 rounded-md px-2 py-2 text-[14px] text-night-muted hover:bg-night-panel hover:text-night-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
                        >
                          <n.icon className="size-4 shrink-0 text-electric-soft" aria-hidden="true" />
                          {n.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Link to="/create" onClick={() => setOpen(false)} className={btn("primary", "md", "mt-6 w-full sm:hidden")}>
              <PlusCircle className="size-4" aria-hidden="true" />
              Create live page
            </Link>
            {signedIn ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void supabase.auth.signOut();
                }}
                className={btn("secondary", "md", "mt-2 w-full sm:hidden")}
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sign out{user?.email ? ` (${user.email})` : ""}
              </button>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className={btn("secondary", "md", "mt-2 w-full sm:hidden")}>
                <LogIn className="size-4" aria-hidden="true" />
                Sign in
              </Link>
            )}
            {status ? (
              <p className="mt-4 flex items-center gap-2 font-mono text-[11px] text-night-muted xl:hidden">{status}</p>
            ) : null}
          </nav>
        </>
      ) : null}
    </header>
  );
}
