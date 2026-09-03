import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useAuth } from "@/lib/useAuth";
import { btn, btnToggle } from "@/lib/ui";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account — UKStats" },
      {
        name: "description",
        content:
          "Sign in to keep your live UK statistics pages and widgets across devices. Everything on UKStats is free — accounts just save your work.",
      },
      { property: "og:title", content: "Sign in to UKStats" },
      { property: "og:description", content: "Free account to keep your live UK statistics pages across devices." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/auth" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { signedIn, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && signedIn) void navigate({ to: "/my-pages" });
  }, [loading, signedIn, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/my-pages` },
        });
        if (err) throw err;
        setNotice("Check your inbox — we've sent a confirmation link to finish creating your account.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        void navigate({ to: "/my-pages" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/my-pages` },
    });
    if (err) setError(err.message);
  }

  async function forgot() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Enter your email address first, then tap the reset link.");
      return;
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) setError(err.message);
    else setNotice("If that email has an account, a password reset link is on its way.");
  }

  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[560px] px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "signin" ? "Sign in" : "Create your free account"}
        </h1>
        <p className="mt-2 text-sm text-night-muted">
          UKStats is free — every figure, map, widget and live page. An account simply keeps the pages you create on
          any device.
        </p>

        <div className="mt-6 flex gap-2" role="tablist" aria-label="Sign in or sign up">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            onClick={() => setMode("signin")}
            className={btnToggle(mode === "signin")}
          >
            <LogIn className="size-4" aria-hidden="true" />
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            onClick={() => setMode("signup")}
            className={btnToggle(mode === "signup")}
          >
            <UserPlus className="size-4" aria-hidden="true" />
            Create account
          </button>
        </div>

        <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-night-line/70 bg-night-panel px-3 py-2.5 text-sm outline-none focus-visible:border-electric"
            />
          </div>
          <div>
            <label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-night-line/70 bg-night-panel px-3 py-2.5 text-sm outline-none focus-visible:border-electric"
            />
          </div>

          {error ? <p className="font-mono text-[12px] text-overdue">{error}</p> : null}
          {notice ? (
            <p className="flex items-start gap-2 font-mono text-[12px] text-fresh">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {notice}
            </p>
          ) : null}

          <button type="submit" disabled={busy} className={btn("primary", "md", "w-full")}>
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-night-muted">
          <span className="h-px flex-1 bg-night-line/70" />
          <span className="font-mono text-[11px]">or</span>
          <span className="h-px flex-1 bg-night-line/70" />
        </div>

        <button type="button" onClick={() => void google()} className={btn("ghost", "md", "w-full")}>
          <ShieldCheck className="size-4" aria-hidden="true" />
          Continue with Google
        </button>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-night-line/60 pt-4 font-mono text-[12px]">
          <button type="button" onClick={() => void forgot()} className="text-night-muted hover:underline">
            Forgot your password?
          </button>
          <Link to="/create" className="text-night-muted hover:underline">
            Create a page without an account
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
