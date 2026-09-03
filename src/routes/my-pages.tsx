import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Copy, LogIn, RefreshCw } from "lucide-react";
import {
  claimSharedPages,
  listAccountPages,
  listOwnedPages,
  renewSharedPage,
  type SharedPage,
} from "@/lib/shared-pages.functions";
import { getOwnerToken } from "@/lib/owner-token";
import { countdown } from "@/lib/pages";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { fmtDate } from "@/lib/uk-stats";
import { useAuth } from "@/lib/useAuth";
import { btn } from "@/lib/ui";

export const Route = createFileRoute("/my-pages")({
  head: () => ({
    meta: [
      { title: "My live statistics pages — UK National Data Register" },
      {
        name: "description",
        content:
          "Manage the free live UK statistics pages you created: see how long each stays live, keep them live, share or copy the link.",
      },
      { property: "og:title", content: "My live statistics pages" },
      { property: "og:description", content: "Manage, renew and share the free live UK statistics pages you created." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/my-pages" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyPages,
});

function MyPages() {
  const listLocal = useServerFn(listOwnedPages);
  const listAccount = useServerFn(listAccountPages);
  const claim = useServerFn(claimSharedPages);
  const renew = useServerFn(renewSharedPage);
  const { signedIn, user, loading } = useAuth();

  const [token, setToken] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [renewing, setRenewing] = useState<string | null>(null);

  useEffect(() => {
    setToken(getOwnerToken());
    setOrigin(window.location.origin);
  }, []);

  // Attach anything made anonymously in this browser to the account.
  useEffect(() => {
    if (!signedIn || !token) return;
    void claim({ data: { ownerToken: token } }).catch(() => undefined);
  }, [signedIn, token, claim]);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["owned-pages", token, user?.id ?? "anon"],
    queryFn: async () => {
      const local = await listLocal({ data: { ownerToken: token } });
      if (!signedIn) return local;
      const mine = await listAccount();
      const seen = new Set<string>();
      return [...mine, ...local].filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)));
    },
    enabled: token.length > 0 && !loading,
  });

  async function keepLive(page: SharedPage) {
    setRenewing(page.slug);
    try {
      await renew({ data: { slug: page.slug, ownerToken: token } });
      await refetch();
    } finally {
      setRenewing(null);
    }
  }

  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader />

      <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">My live pages</h1>
        <p className="mt-2 max-w-2xl text-sm text-night-muted">
          Every page is free and stays live for a year — tap “Keep it live” to reset the clock whenever you like.
          {signedIn
            ? " Signed in, so your pages follow you to any device."
            : " Pages made in this browser show here without an account; sign in to keep them if you change device."}
        </p>

        {!signedIn && !loading ? (
          <Link to="/auth" className={btn("secondary", "md", "mt-4")}>
            <LogIn className="size-4" aria-hidden="true" />
            Sign in to keep your pages
          </Link>
        ) : null}

        {isLoading || !token ? (
          <p className="mt-8 font-mono text-[12px] text-night-muted">Loading…</p>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="mt-8 rounded-xl border border-night-line/60 bg-night-panel/40 p-6">
            <p className="text-sm text-night-muted">You haven't created a live page yet.</p>
            <Link to="/create" className={btn("primary", "md", "mt-4")}>
              Create your first page
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {data!.map((p) => {
              const live = new Date(p.expiresAt).getTime() > Date.now();
              const url = `${origin}/p/${p.slug}`;
              return (
                <div key={p.slug} className="rounded-xl border border-night-line/60 bg-night-panel/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        to="/p/$slug"
                        params={{ slug: p.slug }}
                        className="text-[15px] font-semibold tracking-tight hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="mt-1 font-mono text-[11px] text-night-muted">
                        {p.metricIds.length} figures · free · created {fmtDate(p.createdAt)} · {p.viewCount} views
                        {p.claimed ? " · saved to your account" : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-[11px] ${
                        live ? "bg-fresh/10 text-fresh" : "bg-overdue/10 text-overdue"
                      }`}
                    >
                      {live ? countdown(p.expiresAt) : `expired ${fmtDate(p.expiresAt)}`}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-night-line/60 pt-3">
                    <button
                      onClick={() => {
                        void navigator.clipboard?.writeText(url);
                        setCopied(p.slug);
                        window.setTimeout(() => setCopied(null), 1600);
                      }}
                      className={btn("secondary", "sm")}
                    >
                      <Copy className="size-4" aria-hidden="true" />
                      {copied === p.slug ? "Link copied" : "Copy link"}
                    </button>
                    <button onClick={() => void keepLive(p)} disabled={renewing === p.slug} className={btn("primary", "sm")}>
                      <RefreshCw className="size-4" aria-hidden="true" />
                      {renewing === p.slug ? "Renewing…" : "Keep it live"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
