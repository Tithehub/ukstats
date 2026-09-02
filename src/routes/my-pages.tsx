import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { extendSharedPage, listOwnedPages } from "@/lib/shared-pages.functions";
import { getOwnerToken } from "@/lib/owner-token";
import { TIERS, countdown } from "@/lib/tiers";
import { fmtDate } from "@/lib/uk-stats";

export const Route = createFileRoute("/my-pages")({
  head: () => ({
    meta: [
      { title: "My live statistics pages — UK National Data Register" },
      {
        name: "description",
        content: "Manage the live UK statistics pages you created: see how long each stays live, extend, share or copy the link.",
      },
      { property: "og:title", content: "My live statistics pages" },
      { property: "og:description", content: "Manage, extend and share the live UK statistics pages you created." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyPages,
});

function MyPages() {
  const list = useServerFn(listOwnedPages);
  const extend = useServerFn(extendSharedPage);
  const [token, setToken] = useState("");
  const [origin, setOrigin] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setToken(getOwnerToken());
    setOrigin(window.location.origin);
  }, []);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["owned-pages", token],
    queryFn: () => list({ data: { ownerToken: token } }),
    enabled: token.length > 0,
  });

  async function doExtend(slug: string, tier: string) {
    setBusy(slug);
    try {
      await extend({ data: { slug, tier, ownerToken: token } });
      await refetch();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-ground font-sans text-ink">
      <header className="border-b border-steel/10">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-ink font-mono text-xs font-semibold text-ground">
              UK
            </span>
            <span className="text-[13px] font-semibold tracking-tight">National Data Register</span>
          </Link>
          <Link to="/create" className="rounded-md bg-ink px-3 py-2 text-[13px] font-medium text-ground hover:bg-steel">
            New live page
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">My live pages</h1>
        <p className="mt-2 max-w-2xl text-sm text-steel">
          Pages created from this browser. Keep the browser data and you keep the pages — no account needed.
        </p>

        {isLoading || !token ? (
          <p className="mt-8 font-mono text-[12px] text-steel/60">Loading…</p>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="mt-8 rounded-xl bg-card/50 p-6 ring-1 ring-ink/10">
            <p className="text-sm text-steel">You haven't created a live page yet.</p>
            <Link to="/create" className="mt-4 inline-block rounded-md bg-ink px-4 py-2 text-sm text-ground">
              Create your first page
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {data!.map((p) => {
              const live = new Date(p.expiresAt).getTime() > Date.now();
              const url = `${origin}/p/${p.slug}`;
              return (
                <div key={p.slug} className="rounded-xl bg-card/50 p-4 ring-1 ring-ink/10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        to="/p/$slug"
                        params={{ slug: p.slug }}
                        className="text-[15px] font-semibold tracking-tight hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="mt-1 font-mono text-[11px] text-steel/70">
                        {p.metricIds.length} figures · {p.paymentStatus === "pending" ? "payment pending" : p.paymentStatus} ·
                        created {fmtDate(p.createdAt)} · {p.viewCount} views
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

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3">
                    <button
                      onClick={() => void navigator.clipboard?.writeText(url)}
                      className="rounded-md bg-ink/5 px-2.5 py-1.5 font-mono text-[11px] text-steel hover:bg-ink/10"
                    >
                      Copy link
                    </button>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-steel/50">Extend</span>
                    {TIERS.filter((t) => t.id !== "preview").map((t) => (
                      <button
                        key={t.id}
                        disabled={busy === p.slug}
                        onClick={() => void doExtend(p.slug, t.id)}
                        className="rounded-md bg-ink/5 px-2.5 py-1.5 font-mono text-[11px] text-steel hover:bg-ink/10 disabled:opacity-50"
                      >
                        {t.price} · {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
