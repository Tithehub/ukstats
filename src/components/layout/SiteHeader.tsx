import { LIVE_STREAM_URL } from "@/lib/brand";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { CHAT_ENABLED } from "@/lib/chat-flag";
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
  Search,
  Globe2,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { btn, iconBtn } from "@/lib/ui";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { Button } from '@/components/ui/button';
import { currentBrand } from "@/lib/brand-host";

interface NavItem {
  wide?: boolean;
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Grouped so the drawer reads by theme rather than as one long list. */
const NAV_GROUPS: { name: string; items: NavItem[] }[] = [
  {
    name: "Explore statistics",
    items: [
      { to: "/", label: "Home — live statistics & globe", icon: Home },
      { to: "/register", label: "UK statistics", icon: Table2 },
      { to: "/maps", label: "Maps", icon: MapIcon },
      { to: "/small-boats", label: "Small boats since 2018", icon: Table2 },
      { to: "/grooming-gangs-inquiry", label: "Grooming gangs inquiry", icon: FileText },
      { to: "/scandals", label: "Scandals — official records", icon: FileText },
      { to: "/education", label: "Education — schools, Ofsted & universities", icon: FileText },
      { to: "/spending", label: "Public spending & FOI", icon: Banknote },
      { to: "/safest-places", label: "City crime rankings", icon: MapIcon },
      { to: "/world", label: "World rankings (200+ countries)", icon: Globe2 },
      { to: "/countries", label: "Countries", icon: MapIcon },
      { to: "/gold", label: "Gold reserves", icon: Banknote },
      { to: "/sources", label: "Official sources", icon: Table2 },
      { to: "/global", label: "Rest of the world", icon: MapIcon },
      { to: "/daily", label: "Daily statement", icon: CalendarDays },
      { to: "/compare", label: "Compare figures", icon: GitCompareArrows },
      { to: "/calendar", label: "Release calendar", icon: CalendarDays },
      { to: "/status", label: "Source availability", icon: Activity },
    ],
  },
  {
    name: "Understand the numbers",
    items: [
      { to: "/tax-vs-welfare", label: "Tax vs welfare", icon: Banknote },
      { to: "/foreign-aid", label: "Foreign aid", icon: Plane },
      { to: "/polling", label: "Polling", icon: Vote },
      { to: "/parties", label: "Political party comparison", icon: Vote },
      { to: "/governments", label: "Governments", icon: LayoutGrid },
      { to: "/restore-britain", label: "Restore Britain videos & stories", icon: FileText },
      { to: "/preparedness", label: "Emergency Preparedness", icon: LifeBuoy },
      { to: "/globe", label: "World globe — unrest warnings", icon: LayoutGrid },
    ],
  },
  {
    name: "Use & share",
    items: [
      { to: "/widget", label: "Widgets", icon: LayoutGrid },
      { to: "/create", label: "Create a live page", icon: PlusCircle },
      { to: "/my-pages", label: "My pages", icon: FileText },
      { to: "/outreach", label: "Outreach", icon: Bot },
      { to: "/connections", label: "Connect socials", icon: Plug },
      ...(CHAT_ENABLED ? [{ to: "/chat", label: "Live chat", icon: Bot } as const] : []),
      { to: "/support", label: "Support", icon: LifeBuoy },
      { to: "/sponsors", label: "Our sponsors", icon: LifeBuoy },
      { to: "/business-directory", label: "Business directory", icon: LifeBuoy },
      { to: "/reports", label: "Daily PDF reports", icon: FileText },
      { to: "/rent", label: "Rent UKStats (your brand)", icon: PlusCircle },
      { to: "/rent/dashboard", label: "My branded stream", icon: FileText },
      { to: "/sponsor-dashboard", label: "My sponsorship", icon: FileText },
    ],
  },
];

/** The few links that stay on the desktop bar; everything else lives in the menu. */
const PRIMARY: NavItem[] = [
  { to: "/globe", label: "Globe", icon: Globe2 },
  { to: "/register", label: "UK statistics", icon: Table2 },
  { to: "/countries", label: "World", icon: Globe2 },
  { to: "/maps", label: "Maps", icon: MapIcon },
  { to: "/compare-countries", label: "Compare", icon: GitCompareArrows, wide: true },
  { to: "/preparedness", label: "Preparedness", icon: LifeBuoy, wide: true },
];

export function Wordmark() {
  const global = currentBrand() === "global";
  return (
    <Link to="/" className="flex shrink-0 items-baseline gap-0.5 text-lg font-semibold tracking-tight text-night-fg">
      <span className="mr-1.5 inline-flex items-end gap-[2px]" aria-hidden="true">
        <span className="block h-2.5 w-1 rounded-[1px] bg-electric" />
        <span className="block h-4 w-1 rounded-[1px] bg-electric" />
        <span className="block h-3 w-1 rounded-[1px] bg-electric-soft" />
      </span>
      {global ? <>Stats<span className="text-electric">.Solutions</span></> : <>UK<span className="text-electric">Stats</span></>}
    </Link>
  );
}

/** Site-wide navigation. `status` renders an optional live-feed badge. */
export function SiteHeader({ status }: { status?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { signedIn, user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const pathname = useRouterState({ select: state => state.location.pathname });
  useEffect(() => { setOpen(false); }, [pathname]);

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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground">Skip to content</a>
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 2xl:max-w-[1536px] px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-6 overflow-hidden">
          <Wordmark />
          <nav aria-label="Primary" className="hidden items-center gap-1 font-mono text-[12px] xl:flex">
            {PRIMARY.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "text-night-fg bg-night-panel" }}
                className={`${n.wide ? "max-2xl:hidden " : ""}inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-night-muted transition-colors hover:bg-night-panel hover:text-electric-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric`}
              >
                <n.icon className="size-4" aria-hidden="true" />
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="ghost" size="icon" title="Find a statistic"><Link to="/register" aria-label="Find a statistic"><Search /></Link></Button>
          {status ? (
            <span className="hidden">
              {status}
            </span>
          ) : null}
          <Link
            to="/live"
            className={btn("ghost", "sm", "whitespace-nowrap")}
            aria-label="Watch the UKStats live stream"
          >
            <span className="size-2 animate-pulse rounded-full bg-destructive" aria-hidden="true" />
            <span className="sm:hidden">Live</span><span className="max-sm:hidden">Watch live</span>
          </Link>
          <ThemeToggle />
          {signedIn ? (
            <Button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className={btn("ghost", "sm", "max-sm:hidden whitespace-nowrap")}
              title={user?.email ?? undefined}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          ) : (
            <Link to="/auth" className={btn("ghost", "sm", "max-sm:hidden whitespace-nowrap")}>
              <LogIn className="size-4" aria-hidden="true" />
              Sign in
            </Link>
          )}
          <a
            href="https://x.com/ukstatsglobal"
            target="_blank"
            rel="noopener noreferrer"
            className={btn("ghost", "sm", "max-xl:hidden whitespace-nowrap")}
            aria-label="Follow us on X @ukstatsglobal"
          >
            Follow on X
          </a>
          <Link to="/widget" className={btn("secondary", "sm", "max-2xl:hidden whitespace-nowrap")}>
            <LayoutGrid className="size-4" aria-hidden="true" />
            Embed figures
          </Link>
          <Button
            variant="ghost"
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className={iconBtn()}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {open ? (
        <>
          <Button
            variant="ghost"
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-[65px] z-30 h-auto w-auto rounded-none cursor-default bg-night/70 backdrop-blur-sm"
          />
          <nav
            id="site-menu"
            aria-label="All pages"
            className="relative z-40 max-h-[calc(100dvh-65px)] overflow-y-auto border-t border-night-line/60 bg-night px-4 pb-6 pt-4 sm:px-6"
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
              {isAdmin ? (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-electric">Admin</p>
                  <ul className="mt-2 grid gap-0.5">
                    <li>
                      <Link
                        to="/agents"
                        onClick={() => setOpen(false)}
                        activeProps={{ className: "text-night-fg bg-night-panel" }}
                        className="flex min-h-11 items-center gap-2.5 rounded-md px-2 py-2 text-[14px] text-night-muted hover:bg-night-panel hover:text-night-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
                      >
                        <Bot className="size-4 shrink-0 text-electric-soft" aria-hidden="true" />
                        Agents
                      </Link>
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>
            <Link to="/create" onClick={() => setOpen(false)} className={btn("primary", "md", "mt-6 w-full sm:hidden")}>
              <PlusCircle className="size-4" aria-hidden="true" />
              Create live page
            </Link>
            {signedIn ? (
              <Button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void supabase.auth.signOut();
                }}
                className={btn("secondary", "md", "mt-2 w-full sm:hidden")}
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sign out{user?.email ? ` (${user.email})` : ""}
              </Button>
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
