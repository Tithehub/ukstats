import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export function GameShell({ children, back = true, note }: { children: ReactNode; back?: boolean; note?: string }) {
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {back && <Link to="/games" className="text-sm text-electric-soft underline">← All games</Link>}
        {children}
        <p className="mt-10 text-xs text-night-muted">{note ?? "Free to play. Every answer is a World Bank figure exactly as published, with its year — nothing is estimated or made up."}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
