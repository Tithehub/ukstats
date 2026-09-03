import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShareRow } from "@/components/ShareRow";
import { getMapLayers, getStreetCrime, type StreetCrime } from "@/lib/uk-stats.functions";
import { fmtDate } from "@/lib/uk-stats";

const StatsMap = lazy(() => import("@/components/maps/StatsMap"));

export const Route = createFileRoute("/maps")({
  head: () => ({
    meta: [
      { title: "UK statistics heat maps — crime, house prices by area" },
      {
        name: "description",
        content:
          "Interactive heat maps of official UK statistics: recorded crime rates by police force area, regional house prices, and street-level Police.uk crime by postcode.",
      },
      { property: "og:title", content: "UK statistics heat maps" },
      {
        property: "og:description",
        content: "Recorded crime by police force area, regional house prices and street-level Police.uk crime.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/maps" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/maps" }],
  }),
  loader: () => getMapLayers(),
  component: MapsPage,
});

function MapsPage() {
  const layers = Route.useLoaderData();
  const [layerId, setLayerId] = useState(layers[0]?.id ?? "");
  const [postcode, setPostcode] = useState("");
  const [points, setPoints] = useState<StreetCrime[]>([]);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const layer = layers.find((l) => l.id === layerId) ?? layers[0] ?? null;

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const q = postcode.trim();
    if (!q) return;
    setStatus("Looking up postcode…");
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(q)}`);
      if (!res.ok) {
        setStatus("That postcode was not found by the Ordnance Survey postcode lookup.");
        return;
      }
      const body = (await res.json()) as { result: { latitude: number; longitude: number; admin_district: string } };
      const { latitude, longitude, admin_district } = body.result;
      setFocus({ lat: latitude, lng: longitude });
      setStatus(`Loading Police.uk street-level crime around ${q.toUpperCase()}, ${admin_district}…`);
      const crime = await getStreetCrime({ data: { lat: latitude, lng: longitude } });
      setPoints(crime.points);
      setStatus(
        crime.error
          ? `Police.uk unreachable: ${crime.error}`
          : crime.points.length
            ? `${crime.points.length.toLocaleString("en-GB")} street-level crimes published for ${crime.month} within one mile.`
            : "Police.uk published no street-level crimes for this point in its latest month.",
      );
    } catch (err) {
      setStatus(`Lookup failed: ${(err as Error).message}`);
    }
  }

  return (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-night-muted">Geography</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">UK statistics heat maps</h1>
        <p className="mt-3 max-w-2xl text-night-muted">
          Every shaded area shows a figure exactly as its publisher released it. Search a postcode to overlay
          street-level crimes published by Police.uk.
        </p>

        {layers.length === 0 ? (
          <p className="mt-8 rounded-lg border border-night-line/70 bg-night-panel p-6 font-mono text-[13px] text-overdue">
            No live feed. The publishers' data files could not be read for this request — reload to try again.
          </p>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {layers.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLayerId(l.id)}
                  aria-pressed={l.id === layer?.id}
                  className={`rounded-md border px-3 py-2 font-mono text-[12px] transition-colors ${
                    l.id === layer?.id
                      ? "border-electric bg-electric/10 text-night-fg"
                      : "border-night-line/70 text-night-muted hover:text-electric-soft"
                  }`}
                >
                  {l.title}
                </button>
              ))}
            </div>

            <form onSubmit={search} className="mt-4 flex flex-wrap gap-2">
              <label htmlFor="postcode" className="sr-only">
                Postcode
              </label>
              <input
                id="postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Postcode, e.g. SW1A 1AA"
                className="w-56 rounded-md border border-night-line/70 bg-night-panel px-3 py-2 font-mono text-[13px] text-night-fg placeholder:text-night-muted focus-visible:outline-2 focus-visible:outline-electric"
              />
              <button
                type="submit"
                className="rounded-md bg-electric px-3 py-2 text-[13px] font-medium text-night transition-opacity hover:opacity-90"
              >
                Show street-level crime
              </button>
              {points.length ? (
                <button
                  type="button"
                  onClick={() => {
                    setPoints([]);
                    setStatus(null);
                  }}
                  className="rounded-md border border-night-line/70 px-3 py-2 font-mono text-[12px] text-night-muted"
                >
                  Clear pins
                </button>
              ) : null}
            </form>
            {status ? <p className="mt-2 font-mono text-[12px] text-night-muted">{status}</p> : null}

            {layer ? (
              <>
                <div className="mt-5">
                  <ClientOnly
                    fallback={
                      <div className="h-[70vh] min-h-[420px] w-full animate-pulse rounded-lg border border-night-line/70 bg-night-panel" />
                    }
                  >
                    <Suspense
                      fallback={
                        <div className="h-[70vh] min-h-[420px] w-full animate-pulse rounded-lg border border-night-line/70 bg-night-panel" />
                      }
                    >
                      <StatsMap layer={layer} points={points} focus={focus} />
                    </Suspense>
                  </ClientOnly>
                </div>

                <div className="mt-4 grid gap-3 rounded-lg border border-night-line/70 bg-night-panel p-4 font-mono text-[12px] text-night-muted sm:grid-cols-2">
                  <p>
                    <span className="text-night-fg">{layer.title}</span> — {layer.unit}
                    {layer.period ? ` · ${layer.period}` : ""}
                  </p>
                  <p>
                    Source:{" "}
                    <a href={layer.sourceUrl} className="text-electric-soft underline" rel="noreferrer" target="_blank">
                      {layer.source}
                    </a>
                    {layer.asOf ? ` · published ${fmtDate(layer.asOf)}` : ""}
                  </p>
                  <p className="sm:col-span-2 text-night-fg">Coverage: {layer.coverage}</p>
                  <p className="sm:col-span-2">
                    Areas with no published figure from this source stay unshaded and are labelled “Not published by
                    this source”. Scotland records crime under the Scottish Crime Recording Standard and is published
                    separately by the{" "}
                    <a
                      href="https://www.gov.scot/collections/recorded-crime-in-scotland/"
                      className="text-electric-soft underline"
                      rel="noreferrer"
                      target="_blank"
                    >
                      Scottish Government
                    </a>
                    ; Northern Ireland is published by the{" "}
                    <a
                      href="https://www.psni.police.uk/about-us/our-publications-and-reports/official-statistics/police-recorded-crime-statistics"
                      className="text-electric-soft underline"
                      rel="noreferrer"
                      target="_blank"
                    >
                      PSNI
                    </a>
                    . Street-level pins come from the{" "}
                    <a
                      href="https://data.police.uk/docs/method/crime-street/"
                      className="text-electric-soft underline"
                      rel="noreferrer"
                      target="_blank"
                    >
                      Police.uk street-level crime API
                    </a>
                    , which covers England, Wales and Northern Ireland only — it carries no Police Scotland data.
                  </p>
                </div>


                <h2 className="mt-10 text-lg font-semibold">{layer.title} by area</h2>
                <div className="mt-3 overflow-x-auto rounded-lg border border-night-line/70">
                  <table className="w-full border-collapse font-mono text-[12px]">
                    <thead className="bg-night-panel text-night-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-normal">Area</th>
                        <th className="px-3 py-2 text-left font-normal">Code</th>
                        <th className="px-3 py-2 text-right font-normal">{layer.unit}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...layer.areas]
                        .sort((a, b) => b.value - a.value)
                        .map((a) => (
                          <tr key={a.code} className="border-t border-night-line/50">
                            <td className="px-3 py-2 text-night-fg">{a.name}</td>
                            <td className="px-3 py-2 text-night-muted">{a.code}</td>
                            <td className="px-3 py-2 text-right text-night-fg">{a.formatted}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </>
        )}

        <div className="mt-10">
          <ShareRow title="UK statistics heat maps" path="/maps" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
