import { Link, useRouterState } from "@tanstack/react-router";
import { Globe2, Home, Radio, Table2, BarChart3 as Search } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/register", label: "UK", icon: Table2 },
  { to: "/world", label: "World", icon: Search },
  { to: "/globe", label: "Globe", icon: Globe2 },
  { to: "/live", label: "Live", icon: Radio },
] as const;

/** Phone-only bottom bar; hidden on full-screen surfaces (broadcast, studio, embeds, globe). */
export function MobileTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (/^\/(globe|embed|widget|s\/|p\/|\w+\/embed)/.test(path) || path.includes("/broadcast") || path.includes("/embed/")) return null;
  return (
    <>
      <div className="h-16 md:hidden" aria-hidden="true" />
      <nav aria-label="Quick links" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-night-line/60 bg-night/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: t.to === "/" }}
            activeProps={{ className: "text-electric" }}
            inactiveProps={{ className: "text-night-muted" }}
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 font-mono text-[10px] uppercase tracking-wider"
          >
            <t.icon className="size-5" aria-hidden="true" />
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
