import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON, LayerGroup } from "leaflet";
import type { MapLayer, StreetCrime } from "@/lib/uk-stats.functions";

/** ONS Open Geography boundary services, generalised and clipped to the coastline. */
const BOUNDARY_URL: Record<MapLayer["boundary"], string> = {
  pfa: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Police_Force_Areas_(December_2024)_Boundaries_EW_BUC/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson",
  region:
    "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Regions_(December_2025)_Boundaries_EN_BUC/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson",
};

interface Feature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: unknown;
}

const codeOf = (props: Record<string, unknown>): string | null => {
  for (const [k, v] of Object.entries(props)) {
    if (/^(PFA|RGN)\d{2}CD$/i.test(k) && typeof v === "string") return v;
  }
  return null;
};

const boundaryCache = new Map<string, Promise<{ features: Feature[] }>>();
function boundaries(kind: MapLayer["boundary"]) {
  const hit = boundaryCache.get(kind);
  if (hit) return hit;
  const p = fetch(BOUNDARY_URL[kind]).then((r) => {
    if (!r.ok) throw new Error(`Boundary service returned ${r.status}`);
    return r.json() as Promise<{ features: Feature[] }>;
  });
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
          [54.3, -2.5],
          6,
        );
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>. Boundaries: ONS Open Geography Portal, Crown copyright.',
          maxZoom: 18,
        }).addTo(map.current);
        markers.current = L.layerGroup().addTo(map.current);
      }

      try {
        const geo = await boundaries(layer.boundary);
        if (cancelled || !map.current) return;
        const byCode = new Map(layer.areas.map((a) => [a.code, a]));
        shapes.current?.remove();
        shapes.current = L.geoJSON(geo as never, {
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
            const name =
              area?.name ??
              (Object.entries(props).find(([k]) => /^(PFA|RGN)\d{2}NM$/i.test(k))?.[1] as string | undefined) ??
              "Area";
            lyr.bindTooltip(
              area
                ? `<strong>${name}</strong><br>${area.formatted}<br><span style="opacity:.7">${layer.unit}</span>`
                : `<strong>${name}</strong><br>No published figure`,
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
  }, [layer, scale]);

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
        className="h-[70vh] min-h-[420px] w-full rounded-lg border border-night-line/70 bg-night-panel"
      />
      {error ? (
        <p className="mt-2 font-mono text-[12px] text-overdue">Boundary service unreachable: {error}</p>
      ) : null}
    </div>
  );
}
