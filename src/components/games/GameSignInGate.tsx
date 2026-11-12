import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/useAuth";

/** Shows the game only to signed-in players; everyone else gets a sign-up prompt. */
export function GameSignInGate({ children }: { children: ReactNode }) {
  const { signedIn, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div className="mt-6 h-64 w-full animate-pulse rounded-lg bg-night-panel" aria-busy="true" />;
  if (signedIn) return <>{children}</>;
  return (
    <section className="mt-6 rounded-xl border border-night-muted/30 bg-night-panel p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Sign up free to play</h1>
      <p className="mt-2 text-night-muted">All UKStats games are free. Create an account to play and get ranked on the leaderboards.</p>
      <p className="mt-2 text-sm text-night-muted">Tip: pick a nickname rather than your real name — it's shown publicly on leaderboards.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link to="/auth" search={{ next: pathname }} className="rounded-md bg-electric px-5 py-2.5 font-semibold text-night">Create account</Link>
        <Link to="/auth" search={{ next: pathname }} className="rounded-md border border-electric-soft px-5 py-2.5 font-semibold text-electric-soft">Sign in</Link>
      </div>
    </section>
  );
}
