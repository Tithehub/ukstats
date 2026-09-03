import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON, LayerGroup } from "leaflet";
import type { MapLayer, StreetCrime } from "@/lib/uk-stats.functions";

/** ONS Open Geography boundary services, generalised and clipped to the coastline. */
const ARC = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/ArcGIS/rest/services";
const Q = "/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson";
const BOUNDARY_URL: Record<MapLayer["boundary"], string[]> = {
  pfa: [`${ARC}/Police_Force_Areas_Dec_2024_EW_BUC${Q}`],
  "region-country": [
    `${ARC}/Regions_December_2025_Boundaries_EN_BUC${Q}`,
    `${ARC}/Countries_December_2025_Boundaries_UK_BUC${Q}`,
  ],
  "scotland-council": [`${ARC}/Local_Authority_Districts_December_2024_Boundaries_UK_BUC${Q}`],
};

interface Feature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: unknown;
}

const codeOf = (props: Record<string, unknown>): string | null => {
  for (const [k, v] of Object.entries(props)) {
    if (/^(PFA|RGN|CTRY|LAD)\d{2}CD$/i.test(k) && typeof v === "string") return v;
  }
  return null;
};

const nameOf = (props: Record<string, unknown>): string | undefined => {
  for (const [k, v] of Object.entries(props)) {
    if (/^(PFA|RGN|CTRY|LAD)\d{2}NM$/i.test(k) && typeof v === "string") return v;
  }
  return undefined;
};

const boundaryCache = new Map<string, Promise<{ features: Feature[] }>>();
function boundaries(kind: MapLayer["boundary"]) {
  const hit = boundaryCache.get(kind);
  if (hit) return hit;
  const p = Promise.all(
    BOUNDARY_URL[kind].map(async (url) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Boundary service returned ${r.status}`);
      return (await r.json()) as { features: Feature[] };
    }),
  ).then((sets) => ({ features: sets.flatMap((s) => s.features) }));
  boundaryCache.set(kind, p);
  p.catch(() => boundaryCache.delete(kind));
  return p;
}


/** Sequential ramp used for every choropleth, so layers stay comparable. */
const RAMP = ["#0b2d4a", "#124a72", "#1a6b9c", "#2b8fc4", "#5cb6e2", "#9bd6f2"];
function shade(value: number, min: number, max: number): string {
  if (max <= min) return RAMP[3]!;
  const t = (value - min) / (max - min);
  return RAMP[Math.min(RAMP.length - 1, Math.max(0, Math.round(t * (RAMP.length - 1))))]!;
}

export interface StatsMapProps {
  layer: MapLayer;
  points: StreetCrime[];
  focus: { lat: number; lng: number } | null;
}

export default function StatsMap({ layer, points, focus }: StatsMapProps) {
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);
  const shapes = useRef<LeafletGeoJSON | null>(null);
  const markers = useRef<LayerGroup | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scale = useMemo(() => {
    const values = layer.areas.map((a) => a.value);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [layer]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !el.current) return;
      if (!map.current) {
        map.current = L.map(el.current, { scrollWheelZoom: true, attributionControl: true }).setView(
          [55.2, -3.6],
          5,
        );
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. Boundaries: ONS Open Geography Portal, Crown copyright.',
          maxZoom: 18,
          className: "basemap-tiles",
        }).addTo(map.current);
        markers.current = L.layerGroup().addTo(map.current);
      }

      try {
        const geo = await boundaries(layer.boundary);
        if (cancelled || !map.current) return;
        const byCode = new Map(layer.areas.map((a) => [a.code, a]));
        // Keep only the shapes this layer's publisher actually covers, so overlapping
        // country and region outlines never double up on the same ground.
        const relevant = geo.features.filter((f) => {
          const code = codeOf(f.properties) ?? "";
          if (byCode.has(code)) return true;
          if (layer.boundary === "region-country") return false;
          if (layer.boundary === "scotland-council") return code.startsWith("S12");
          return true;
        });
        shapes.current?.remove();
        shapes.current = L.geoJSON({ type: "FeatureCollection", features: relevant } as never, {
          style: (feature) => {
            const area = byCode.get(codeOf((feature?.properties ?? {}) as Record<string, unknown>) ?? "");
            return {
              weight: 0.8,
              color: "#0d1b2a",
              fillOpacity: area ? 0.82 : 0.15,
              fillColor: area ? shade(area.value, scale.min, scale.max) : "#33475b",
            };
          },
          onEachFeature: (feature, lyr) => {
            const props = (feature.properties ?? {}) as Record<string, unknown>;
            const area = byCode.get(codeOf(props) ?? "");
            const name = area?.name ?? nameOf(props) ?? "Area";
            lyr.bindTooltip(
              area
                ? `<strong>${name}</strong><br>${area.formatted}<br><span style="opacity:.7">${layer.unit}</span>`
                : `<strong>${name}</strong><br>Not published by this source`,
              { sticky: true },
            );
          },
        }).addTo(map.current);

        setError(null);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [layer, scale, focus]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !map.current || !markers.current) return;
      markers.current.clearLayers();
      for (const p of points) {
        L.circleMarker([p.lat, p.lng], {
          radius: 5,
          weight: 1,
          color: "#0d1b2a",
          fillColor: "#f4a259",
          fillOpacity: 0.9,
        })
          .bindPopup(
            `<strong>${p.category}</strong><br>${p.street}<br><span style="opacity:.7">${p.month}${
              p.outcome ? ` · ${p.outcome}` : ""
            }</span>`,
          )
          .addTo(markers.current!);
      }
      if (focus) map.current.setView([focus.lat, focus.lng], 15);
    })();
    return () => {
      cancelled = true;
    };
  }, [points, focus]);

  useEffect(() => {
    return () => {
      map.current?.remove();
      map.current = null;
      shapes.current = null;
      markers.current = null;
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={el}
        role="application"
        aria-label={`Map of ${layer.title}`}
        className="h-[60vh] min-h-[340px] w-full sm:h-[70vh] sm:min-h-[420px] rounded-lg border border-night-line/70 bg-night-panel"
      />
      {error ? (
        <p className="mt-2 font-mono text-[12px] text-overdue">Boundary service unreachable: {error}</p>
      ) : null}
    </div>
  );
}
