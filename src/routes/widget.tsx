import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getUkStats } from "@/lib/uk-stats.functions";
import { CATEGORIES, type StatsPayload } from "@/lib/uk-stats";
import { isStatusMetric } from "@/components/ThreatBoard";

const statsQuery = queryOptions<StatsPayload>({
  queryKey: ["uk-stats"],
  queryFn: () => getUkStats(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/widget")({
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQuery),
  head: () => ({
    meta: [
      { title: "Build a live UK statistics widget — National Data Register" },
      {
        name: "description",
        content:
          "Configure and copy an embeddable widget showing live UK official statistics or the national alert and threat levels, with source and data age built in.",
      },
      { property: "og:title", content: "Build a live UK statistics widget" },
      {
        property: "og:description",
        content: "Pick figures, choose a theme, copy the embed code. Always live, always sourced.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WidgetBuilder,
});

type Mode = "board" | "metrics";

function WidgetBuilder() {
  const { data } = useSuspenseQuery(statsQuery);
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const [mode, setMode] = useState<Mode>("board");
  const [selected, setSelected] = useState<string[]>(() =>
    data.metrics.filter((m) => !isStatusMetric(m)).slice(0, 2).map((m) => m.id),
  );
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [density, setDensity] = useState<"full" | "compact">("full");
  const [provenance, setProvenance] = useState(true);
  const [copied, setCopied] = useState(false);

  const choosable = data.metrics.filter((m) => !isStatusMetric(m));

  const src = useMemo(() => {
    const params = new URLSearchParams();
    params.set("theme", theme);
    params.set("density", density);
    if (!provenance) params.set("provenance", "false");
    if (mode === "metrics") {
      const [first, ...rest] = selected;
      if (rest.length) params.set("ids", rest.join(","));
      return `${origin}/embed/${first ?? ""}?${params.toString()}`;
    }
    return `${origin}/embed/board?${params.toString()}`;
  }, [mode, selected, theme, density, provenance, origin]);

  const height = mode === "board" ? 620 : density === "compact" ? 190 + 150 * Math.max(0, selected.length - 1) : 260 + 200 * Math.max(0, selected.length - 1);
  const snippet = `<iframe src="${src}" width="100%" height="${height}" style="border:0;max-width:760px" title="UK National Data Register live widget" loading="lazy"></iframe>`;

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const valid = mode === "board" || selected.length > 0;

  return (
    <div className="min-h-screen bg-ground font-sans text-ink">
      <header className="border-b border-steel/10">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-steel/60">Widget builder</p>
            <h1 className="text-lg font-semibold tracking-tight">Embed live UK statistics anywhere</h1>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-steel">
            <Link to="/" className="hover:underline">
              Dashboard
            </Link>
            <Link to="/create" className="hover:underline">
              Live page
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1200px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <section className="space-y-5">
          <div className="rounded-[14px] bg-card/60 p-4 ring-1 ring-ink/10">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-steel/60">1 · What to show</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(
                [
                  ["board", "Alert & threat board"],
                  ["metrics", "Chosen figures"],
                ] as [Mode, string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-md px-3 py-2 text-[12px] font-medium transition-colors ${
                    mode === m ? "bg-ink text-ground" : "bg-ink/5 text-steel hover:bg-ink/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {mode === "board" ? (
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-steel/70">
                Terrorism threat levels, Met Office warnings, Environment Agency flood warnings, UKHSA weather-health
                alerts and Defra air quality — each on the issuing body's own scale.
              </p>
            ) : (
              <div className="mt-3 max-h-[320px] space-y-3 overflow-y-auto pr-1">
                {CATEGORIES.map((c) => {
                  const items = choosable.filter((m) => m.category === c);
                  if (!items.length) return null;
                  return (
                    <div key={c}>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-steel/50">{c}</p>
                      <div className="mt-1 space-y-1">
                        {items.map((m) => (
                          <label key={m.id} className="flex cursor-pointer items-start gap-2 text-[12px]">
                            <input
                              type="checkbox"
                              checked={selected.includes(m.id)}
                              onChange={() => toggle(m.id)}
                              className="mt-0.5"
                            />
                            <span>
                              {m.title}
                              <span className="ml-1 font-mono text-[10px] text-steel/50">
                                {m.value ?? "no live value"}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[14px] bg-card/60 p-4 ring-1 ring-ink/10">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-steel/60">2 · Appearance</p>
            <div className="mt-3 grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px]">Theme</span>
                <div className="flex gap-1">
                  {(["light", "dark"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`rounded-md px-3 py-1.5 font-mono text-[11px] ${
                        theme === t ? "bg-ink text-ground" : "bg-ink/5 text-steel"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px]">Density</span>
                <div className="flex gap-1">
                  {(["full", "compact"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDensity(d)}
                      className={`rounded-md px-3 py-1.5 font-mono text-[11px] ${
                        density === d ? "bg-ink text-ground" : "bg-ink/5 text-steel"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center justify-between text-[12px]">
                <span>Show source, age and next release</span>
                <input type="checkbox" checked={provenance} onChange={(e) => setProvenance(e.target.checked)} />
              </label>
            </div>
          </div>

          <div className="rounded-[14px] bg-ink p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand">3 · Paste anywhere</p>
            <code className="mt-2 block break-all font-mono text-[10px] leading-relaxed text-ground/80">
              {valid ? snippet : "Select at least one figure."}
            </code>
            <button
              disabled={!valid}
              onClick={() => {
                void navigator.clipboard.writeText(snippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="mt-3 rounded-md bg-ground px-3 py-2 text-[12px] font-medium text-ink disabled:opacity-40"
            >
              {copied ? "Copied" : "Copy embed code"}
            </button>
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-ground/50">
              The widget re-fetches from the official sources itself, so the figures stay live wherever it is embedded.
            </p>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-steel/60">Live preview</p>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] text-steel underline decoration-brand underline-offset-2"
            >
              Open widget
            </a>
          </div>
          {valid ? (
            <iframe
              key={src}
              src={src}
              title="Widget preview"
              className="w-full rounded-[14px] ring-1 ring-ink/10"
              style={{ height }}
            />
          ) : (
            <div className="grid h-40 place-items-center rounded-[14px] bg-card/40 font-mono text-[12px] text-steel/60 ring-1 ring-ink/10">
              Select at least one figure to preview.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
