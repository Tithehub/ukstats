import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { btn } from "@/lib/ui";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — UKStats" },
      { name: "description", content: "Choose a new password for your free UKStats account." },
      { property: "og:title", content: "Set a new password — UKStats" },
      { property: "og:description", content: "Choose a new password for your free UKStats account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    window.setTimeout(() => void navigate({ to: "/my-pages" }), 1200);
  }

  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[520px] px-4 py-10 sm:px-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <KeyRound className="size-5 text-electric" aria-hidden="true" />
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-night-muted">
          Open this page from the reset link in your email, then choose a new password.
        </p>

        <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="new-password" className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-night-line/70 bg-night-panel px-3 py-2.5 text-sm outline-none focus-visible:border-electric"
            />
          </div>
          {error ? <p className="font-mono text-[12px] text-overdue">{error}</p> : null}
          {done ? <p className="font-mono text-[12px] text-fresh">Password updated — taking you to your pages…</p> : null}
          <button type="submit" disabled={busy} className={btn("primary", "md", "w-full")}>
            {busy ? "Saving…" : "Save new password"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
