import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ExternalLink, Link2, LogIn, Plug, ShieldCheck, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MANUAL_ONLY, SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/social";
import { connectSocialAccount, disconnectSocialAccount, listSocialAccounts } from "@/lib/social.functions";
import { useAuth } from "@/lib/useAuth";
import { btn, btnToggle } from "@/lib/ui";
import { fmtDate } from "@/lib/uk-stats";

export const Route = createFileRoute("/connections")({
  head: () => ({
    meta: [
      { title: "Connect your socials — UKStats outreach" },
      {
        name: "description",
        content:
          "Attach your own Bluesky, Mastodon, Telegram, Discord or Slack account so newly published UK figures can be posted straight from the outreach queue.",
      },
      { property: "og:title", content: "Connect your socials to the UKStats outreach bot" },
      {
        property: "og:description",
        content: "Attach accounts you own and post official UK figures in one tap. Credentials stay server-side.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/connections" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/connections" }],
  }),
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const { signedIn, loading } = useAuth();
  const list = useServerFn(listSocialAccounts);
  const connect = useServerFn(connectSocialAccount);
  const remove = useServerFn(disconnectSocialAccount);

  const [platform, setPlatform] = useState<SocialPlatform>("bluesky");
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spec = SOCIAL_PLATFORMS.find((p) => p.key === platform)!;

  const { data: accounts, refetch, isLoading } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: () => list(),
    enabled: signedIn,
  });

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await connect({ data: { platform, credentials: values } });
      setValues({});
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect that account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-electric">Outreach</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Connect your socials</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-night-muted text-pretty">
          Attach accounts you own and the{" "}
          <Link to="/outreach" className="text-electric-soft underline underline-offset-2">
            outreach queue
          </Link>{" "}
          can post a newly published figure straight to them — always with the official source link. Everything is free.
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-night-line/60 bg-night-panel/40 p-3 text-[13px] text-night-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-fresh" aria-hidden="true" />
          <p>
            Credentials are stored server-side, never returned to the browser, and only used when you press post. Use app
            passwords, bot tokens or webhooks — never your platform password — and revoke them on the platform at any time.
          </p>
        </div>

        {!signedIn && !loading ? (
          <div className="mt-8 rounded-xl border border-night-line/60 bg-night-panel/40 p-6">
            <p className="text-sm text-night-muted">Sign in to attach your accounts. It's free and takes a moment.</p>
            <Link to="/auth" className={btn("primary", "md", "mt-4")}>
              <LogIn className="size-4" aria-hidden="true" />
              Sign in or create an account
            </Link>
          </div>
        ) : null}

        {signedIn ? (
          <>
            <section className="mt-8">
              <h2 className="text-lg font-semibold tracking-tight">Your connections</h2>
              {isLoading ? (
                <p className="mt-3 font-mono text-[12px] text-night-muted">Loading…</p>
              ) : (accounts?.length ?? 0) === 0 ? (
                <p className="mt-3 text-sm text-night-muted">No accounts attached yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {accounts!.map((a) => {
                    const s = SOCIAL_PLATFORMS.find((p) => p.key === a.platform);
                    return (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-night-line/60 bg-night-panel/40 p-4"
                      >
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold">
                            {s?.name ?? a.platform} · <span className="font-normal text-night-muted">{a.label}</span>
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-night-muted">
                            attached {fmtDate(a.createdAt)}
                            {a.lastPostedAt ? ` · last posted ${fmtDate(a.lastPostedAt)}` : ""}
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            await remove({ data: { id: a.id } });
                            await refetch();
                          }}
                          className={btn("secondary", "sm")}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          Disconnect
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="mt-10 rounded-xl border border-night-line/60 bg-night-panel/40 p-4 sm:p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Plug className="size-4 text-electric" aria-hidden="true" />
                Attach an account
              </h2>

              <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Platform">
                {SOCIAL_PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => {
                      setPlatform(p.key);
                      setValues({});
                      setError(null);
                    }}
                    className={btnToggle(platform === p.key)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-[13px] text-night-muted">{spec.blurb}</p>
              <a href={spec.docsUrl} target="_blank" rel="noreferrer" className={btn("secondary", "sm", "mt-3")}>
                <ExternalLink className="size-4" aria-hidden="true" />
                {spec.docsLabel}
              </a>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {spec.fields.map((f) => (
                  <label key={f.key} className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-night-muted">{f.label}</span>
                    <input
                      type={f.secret ? "password" : "text"}
                      autoComplete="off"
                      value={values[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      className="mt-1.5 w-full rounded-lg border border-night-line/70 bg-night px-3 py-2.5 text-sm text-night-fg outline-none focus-visible:ring-2 focus-visible:ring-electric"
                    />
                    {f.help ? <span className="mt-1 block text-[12px] text-night-muted">{f.help}</span> : null}
                  </label>
                ))}
              </div>

              {error ? <p className="mt-4 font-mono text-[12px] text-overdue">{error}</p> : null}

              <button onClick={() => void submit()} disabled={busy} className={btn("primary", "md", "mt-5")}>
                <Link2 className="size-4" aria-hidden="true" />
                {busy ? "Checking with the platform…" : `Connect ${spec.name}`}
              </button>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold tracking-tight">Posted by hand</h2>
              <p className="mt-2 max-w-2xl text-sm text-night-muted">
                These platforms only allow automated posting through a reviewed developer app, so the queue opens their
                composer with the copy ready instead.
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {MANUAL_ONLY.map((m) => (
                  <li key={m.name} className="rounded-lg border border-night-line/60 bg-night-panel/30 p-3 text-[13px]">
                    <span className="font-semibold">{m.name}</span>
                    <span className="block text-night-muted">{m.why}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
