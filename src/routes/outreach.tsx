import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Check, Copy, ExternalLink, Rss, Send, ShieldAlert } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShareRow } from "@/components/ShareRow";
import { getOutreachQueue } from "@/lib/outreach.functions";
import { PLATFORMS, type Draft, type PlatformKey } from "@/lib/outreach";
import { btn, btnToggle, categoryIcon } from "@/lib/ui";

export const Route = createFileRoute("/outreach")({
  head: () => ({
    meta: [
      { title: "Outreach queue — share newly published UK figures" },
      {
        name: "description",
        content:
          "Ready-to-post copy for every newly published UK statistic, written from the official figure with its reference period and a link to the issuing body.",
      },
      { property: "og:title", content: "UKStats outreach queue" },
      {
        property: "og:description",
        content: "Platform-ready posts built from official UK figures, each linking back to the publisher's own release.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/outreach" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/outreach" }],
  }),
  component: OutreachPage,
});

function DraftCard({ draft }: { draft: Draft }) {
  const [platform, setPlatform] = useState<PlatformKey>("x");
  const [copied, setCopied] = useState(false);
  const p = PLATFORMS.find((x) => x.key === platform)!;
  const body = draft.bodies[platform];
  const over = p.limit ? body.length - p.limit : 0;

  return (
    <article className="rounded-xl border border-night-line/60 bg-night-panel/50 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-electric">
            {draft.kind === "digest" ? "Daily digest" : "New figure"}
          </p>
          <h2 className="mt-1 text-[15px] font-semibold leading-snug text-balance">{draft.headline}</h2>
        </div>
        <a href={draft.sourceUrl} target="_blank" rel="noreferrer" className={btn("secondary", "sm")}>
          <ExternalLink className="size-4" aria-hidden="true" />
          Source
        </a>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Platform">
        {PLATFORMS.map((x) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setPlatform(x.key)}
            aria-pressed={platform === x.key}
            className={btnToggle(platform === x.key, "sm")}
          >
            {x.label}
          </button>
        ))}
      </div>

      <p className="mt-3 whitespace-pre-wrap rounded-lg border border-night-line/50 bg-night px-3 py-2.5 font-mono text-[12px] leading-relaxed text-night-fg">
        {body}
      </p>
      <p className="mt-1.5 font-mono text-[10px] text-night-muted">
        {p.guidance}
        {p.limit ? (
          <>
            {" · "}
            <span className={over > 0 ? "text-overdue" : undefined}>
              {body.length}/{p.limit}
            </span>
          </>
        ) : null}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(body);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className={btn("secondary", "sm")}
        >
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? "Copied" : "Copy post"}
        </button>
        <a
          href={p.compose(body, draft.url, draft.headline)}
          target="_blank"
          rel="noreferrer noopener"
          className={btn("primary", "sm")}
        >
          <Send className="size-4" aria-hidden="true" />
          Open {p.label} composer
        </a>
      </div>
    </article>
  );
}

function OutreachPage() {
  const load = useServerFn(getOutreachQueue);
  const { data, isLoading, error } = useQuery({
    queryKey: ["outreach-queue"],
    queryFn: () => load(),
    staleTime: 5 * 60 * 1000,
  });
  const [kind, setKind] = useState<"all" | "release" | "digest">("all");

  const drafts = useMemo(
    () => (data?.drafts ?? []).filter((d) => kind === "all" || d.kind === kind),
    [data, kind],
  );

  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 sm:py-10">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-electric">
          <Bot className="size-4" aria-hidden="true" />
          Outreach
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Share newly published figures</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-night-muted text-pretty">
          Every draft below is built from a figure an official body actually published, with its reference period and a
          link back to the issuing release. Pick a platform, copy the post or open the composer prefilled.
        </p>

        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-ageing/40 bg-ageing/5 px-3 py-2.5 text-[13px] leading-relaxed text-night-muted">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-ageing" aria-hidden="true" />
          <span>
            Post to accounts you control, and read each community's rules first. Mass-posting the same link everywhere
            is spam — it gets the domain blocked and does more harm than no posting at all.
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {(["all", "release", "digest"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={kind === k} className={btnToggle(kind === k, "sm")}>
              {k === "all" ? "Everything" : k === "release" ? "New figures" : "Daily digest"}
            </button>
          ))}
          <a href="/feed.xml" className={btn("secondary", "sm", "ml-auto")}>
            <Rss className="size-4" aria-hidden="true" />
            RSS feed
          </a>
        </div>

        {isLoading ? (
          <p className="mt-8 font-mono text-[13px] text-night-muted">Loading the latest published figures…</p>
        ) : error ? (
          <p className="mt-8 font-mono text-[13px] text-overdue">The register could not be reached. Try again shortly.</p>
        ) : (
          <>
            {!data?.tracking ? (
              <p className="mt-6 font-mono text-[11px] text-night-muted">
                Change tracking has not recorded a movement yet, so the queue is seeded with the most recently published
                figures. Once a scheduled sweep sees a figure move, that release leads the queue.
              </p>
            ) : null}
            <div className="mt-6 grid gap-4">
              {drafts.map((d) => (
                <DraftCard key={d.id} draft={d} />
              ))}
            </div>

            {data?.changes.length ? (
              <section className="mt-10">
                <h2 className="text-lg font-semibold tracking-tight">Recently changed figures</h2>
                <ul className="mt-3 divide-y divide-night-line/50 rounded-xl border border-night-line/60">
                  {data.changes.slice(0, 20).map((c) => {
                    const Icon = categoryIcon(c.category);
                    return (
                      <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-[13px]">
                        <Icon className="size-4 shrink-0 text-electric-soft" aria-hidden="true" />
                        <span className="min-w-0 flex-1">{c.title}</span>
                        <span className="font-mono tabular-nums">{c.value}</span>
                        {c.previous_value ? (
                          <span className="font-mono text-[11px] text-night-muted">was {c.previous_value}</span>
                        ) : null}
                        <a
                          href={c.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] text-electric-soft hover:underline"
                        >
                          {c.source}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
          </>
        )}

        <ShareRow className="mt-10" path="/" title="UKStats — live UK official statistics, every figure sourced" />
      </main>
      <SiteFooter fetchedAt={data?.fetchedAt} />
    </div>
  );
}
