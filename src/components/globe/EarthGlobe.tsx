import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { feature } from "topojson-client";
import topo from "world-atlas/countries-110m.json";
import earth from "@/assets/earth-blue-marble.jpg";
import * as THREE from "three";
import { countryKey, type AcledEvent, type UnrestKind } from "@/lib/unrest";
import { mapName } from "@/lib/migration-flows";

export interface GlobeMarker { id: string; kind: UnrestKind; lat: number; lng: number; label: string; research?: boolean }

export interface GlobeProps {
  /** countryKey -> 0..1 shade, or undefined when no comparable figure. */
  shade: Map<string, number> | null;
  hotspots: Set<string>;
  events: AcledEvent[];
  selected: string | null;
  onSelect: (key: string, name: string) => void;
  markers?: GlobeMarker[];
  onMarker?: (id: string) => void;
  /** Camera target when a marker is picked. */
  focus?: { lat: number; lng: number } | null;
  /** countryKey -> ready colour; overrides shade (advice layers and indicator layers). */
  fill?: Map<string, string> | null;
  /** countryKey -> hover text (figure, rank, year or advice level). */
  labels?: Map<string, string> | null;
  rotate?: boolean | undefined;
  /** Bump to fly back to the starting view. */
  resetKey?: number;
  /** Live-feed pins (news videos, not official) — drawn as a separate label layer. */
  feedPins?: { key: string; lat: number; lng: number; count: number; live: boolean; label: string }[];
  onFeedPin?: (key: string) => void;
  /** Aircraft positions, drawn as one particle layer per colour. */
  planes?: GlobePlane[];
  onPlane?: (id: string) => void;
  /** Selected plane: recent trail (solid) and direction ahead (dashed). */
  planePaths?: { pts: [number, number][]; ahead: boolean; color: string }[];
  /** Small-boat icons in the Channel (one per boat; positions illustrative). */
  boats?: { id: string; lat: number; lng: number; label: string; color?: string }[];
  /** Migration arrows: origin country name to a country name or a fixed point. */
  flows?: GlobeFlow[];
  /** USGS earthquakes (past day). */
  quakes?: { id: string; lat: number; lng: number; mag: number; label: string }[];
  /** Satellites: current position (altitude in globe radii) and ground path. */
  sats?: { id: string; lat: number; lng: number; alt: number; label: string; path: [number, number, number][] }[];
  /** Camera preset request: bump n to apply. */
  preset?: { n: number; kind: "world" | "tilt" | "focus" } | null;
  /** Day/night shading with the sunrise line. */
  dayNight?: boolean;
  /** Pointer and camera readout for the control-room HUD. */
  onTelemetry?: (t: { lat: number | null; lng: number | null; altKm: number }) => void;
}

/** Subsolar point for a UTC time (simple solar declination + equation of time). */
export function sunPosition(d: Date): { lat: number; lng: number } {
  const day = (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5;
  const g = (2 * Math.PI / 365) * (day - 1 + (d.getUTCHours() - 12) / 24);
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const mins = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
  let lng = -((mins + eqt) / 4 - 180);
  lng = ((lng + 540) % 360) - 180;
  return { lat: (decl * 180) / Math.PI, lng };
}

export interface GlobeFlow { id: string; from: string; to: string; toLat?: number | undefined; toLng?: number | undefined; color: string; stroke: number; label: string }

function makeBoat(color = "#f05a28"): THREE.Object3D {
  // A small dinghy seen from above: pointed bow, inflatable rim, a row of people.
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(-0.9, -0.32); s.lineTo(0.45, -0.32); s.quadraticCurveTo(1.0, -0.2, 1.15, 0); s.quadraticCurveTo(1.0, 0.2, 0.45, 0.32); s.lineTo(-0.9, 0.32); s.closePath();
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, flatShading: true }));
  const inner = new THREE.Shape();
  inner.moveTo(-0.75, -0.18); inner.lineTo(0.4, -0.18); inner.quadraticCurveTo(0.8, -0.1, 0.9, 0); inner.quadraticCurveTo(0.8, 0.1, 0.4, 0.18); inner.lineTo(-0.75, 0.18); inner.closePath();
  const floor = new THREE.Mesh(new THREE.ExtrudeGeometry(inner, { depth: 0.24, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: "#1b2330", flatShading: true }));
  floor.position.z = 0.01;
  g.add(rim, floor);
  const head = new THREE.SphereGeometry(0.09, 6, 6), hm = new THREE.MeshStandardMaterial({ color: "#f2f4f7", emissive: "#f2f4f7", emissiveIntensity: 0.3 });
  for (let i = 0; i < 4; i++) for (const y of [-0.08, 0.08]) { const p = new THREE.Mesh(head, hm); p.position.set(-0.55 + i * 0.3, y, 0.3); g.add(p); }
  // Point the bow north-west, towards Kent.
  g.rotation.z = (3 * Math.PI) / 4;
  const wrap = new THREE.Group(); wrap.add(g); wrap.scale.setScalar(0.45);
  wrap.userData = { spin: g, phase: Math.random() * Math.PI * 2, boat: true };
  return wrap;
}

export interface GlobePlane { id: string; lat: number; lng: number; status: "green" | "amber" | "red"; label: string }
// Plain WebGL colours mirroring the fresh / ageing / overdue tokens.
const PLANE_C = { green: "#3fcf7a", amber: "#f0a020", red: "#ff4a3a" } as const;
const planeTex: Partial<Record<GlobePlane["status"], THREE.Texture>> = {};
/** Small white plane silhouette, tinted per layer. */
function planeTexture(st: GlobePlane["status"]) {
  const hit = planeTex[st]; if (hit) return hit;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d")!; x.fillStyle = PLANE_C[st]; x.beginPath();
  x.moveTo(32, 4); x.lineTo(37, 26); x.lineTo(60, 38); x.lineTo(60, 44); x.lineTo(37, 37); x.lineTo(36, 52); x.lineTo(44, 58); x.lineTo(44, 62); x.lineTo(32, 58); x.lineTo(20, 62); x.lineTo(20, 58); x.lineTo(28, 52); x.lineTo(27, 37); x.lineTo(4, 44); x.lineTo(4, 38); x.lineTo(27, 26); x.closePath(); x.fill();
  return (planeTex[st] = new THREE.CanvasTexture(c));
}

// Plain WebGL colours mirroring the overdue (riot) and ageing (protest) tokens.
const KIND = { riot: { c: "#e0452f", ring: "rgba(224,69,47," }, protest: { c: "#f0a020", ring: "rgba(240,160,32," }, strike: { c: "#ff2a1a", ring: "rgba(255,42,26," }, war: { c: "#9a1b1b", ring: "rgba(190,30,30," } } as const;

function makeIcon(kind: UnrestKind, research: boolean): THREE.Object3D {
  const col = new THREE.Color(KIND[kind].c);
  const mat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: research ? 0.3 : 0.8, flatShading: true, transparent: research, opacity: research ? 0.6 : 1 });
  const g = new THREE.Group();
  if (kind === "strike") {
    // Missile diving onto a flash burst.
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2, 8), new THREE.MeshStandardMaterial({ color: "#c9ccd2", flatShading: true }));
    body.position.y = 2.4;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 8), mat); tip.position.y = 1.1; tip.rotation.z = Math.PI;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.06), mat); fin.position.y = 3.3;
    const burst = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), new THREE.MeshStandardMaterial({ color: "#ffd25a", emissive: "#ff7a1a", emissiveIntensity: 1.2, flatShading: true }));
    burst.position.y = 0.4;
    g.add(body, tip, fin, burst);
  } else if (kind === "war") {
    // Crossed swords over a shield.
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 6), mat); shield.rotation.x = Math.PI / 2; shield.position.y = 1.4;
    const steel = new THREE.MeshStandardMaterial({ color: "#e6e8ec", metalness: 0.6, roughness: 0.3, flatShading: true });
    for (const a of [0.7, -0.7]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3, 0.08), steel); b.position.set(0, 1.5, 0.15); b.rotation.z = a; g.add(b); }
    g.add(shield);
  } else if (kind === "riot") {
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.6, 6), mat); outer.position.y = 1.3;
    const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), new THREE.MeshStandardMaterial({ color: "#ffd25a", emissive: "#ffb020", emissiveIntensity: 1, flatShading: true }));
    inner.position.y = 0.6;
    g.add(outer, inner);
  } else {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 6), new THREE.MeshStandardMaterial({ color: "#dcd6c8", flatShading: true }));
    pole.position.y = 1.2;
    const board = new THREE.Mesh(new THREE.BoxGeometry(2, 1.3, 0.2), mat); board.position.y = 2.4;
    g.add(pole, board);
  }
  // Stand the icon up off the globe surface (globe objects face +z outward).
  g.rotation.x = Math.PI / 2;
  const wrap = new THREE.Group(); wrap.add(g);
  wrap.scale.setScalar(research ? 1.1 : 2.2);
  wrap.userData = { spin: g, phase: Math.random() * Math.PI * 2 };
  return wrap;
}

type Feat = { properties: { name: string }; geometry: unknown };
const FEATURES = (feature(topo as any, (topo as any).objects.countries) as unknown as { features: Feat[] }).features;

// WebGL needs plain colours; these mirror the site's overdue and highlight tokens.
const COLORS = { hot: "rgba(214,72,52,0.85)", sel: "#f2f6ff" };

/** Rough centre of a country's largest outline, for camera moves. */
function centre(key: string): { lat: number; lng: number } | null {
  const f = FEATURES.find((x) => countryKey(x.properties.name) === key);
  if (!f) return null;
  const g = f.geometry as { type: string; coordinates: any };
  const polys: number[][][][] = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  let ring: number[][] = [];
  for (const p of polys) if ((p[0]?.length ?? 0) > ring.length) ring = p[0]!;
  if (!ring.length) return null;
  const lng = ring.reduce((s, c) => s + c[0]!, 0) / ring.length;
  const lat = ring.reduce((s, c) => s + c[1]!, 0) / ring.length;
  return { lat, lng };
}

function centreOf(name: string) { const n = mapName(name); return n ? centre(countryKey(n)) : null; }

/** Plain country names and keys, for the search box and no-3D fallback. */
export const GLOBE_COUNTRIES = FEATURES.map((f) => ({ key: countryKey(f.properties.name), name: f.properties.name })).sort((a, b) => a.name.localeCompare(b.name));

export default function EarthGlobe({ shade, hotspots, events, selected, onSelect, markers = [], onMarker, focus, fill, labels, rotate, resetKey = 0, feedPins = [], onFeedPin, planes = [], onPlane, planePaths = [], boats = [], flows = [], quakes = [], sats = [], preset = null, dayNight = false, onTelemetry }: GlobeProps) {
  const icons = useRef(new Map<string, THREE.Object3D>());
  const [still, setStill] = useState(false);
  useEffect(() => { setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  // One animation loop for every icon: gentle bob and turn.
  useEffect(() => {
    if (still) return;
    let raf = 0;
    const tick = (t: number) => {
      for (const o of icons.current.values()) {
        const d = o.userData as { spin: THREE.Object3D; phase: number; boat?: boolean };
        if (d.boat) { d.spin.rotation.x = Math.sin(t / 500 + d.phase) * 0.12; continue; }
        d.spin.rotation.y = t / 900 + d.phase; d.spin.rotation.x = Math.PI / 2;
        d.spin.position.z = 0.4 + Math.sin(t / 400 + d.phase) * 0.4;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [still]);
  useEffect(() => {
    if (!focus) return;
    const g = ref.current; if (!g) return;
    g.controls().autoRotate = false;
    g.pointOfView({ ...focus, altitude: 0.9 }, 900);
  }, [focus?.lat, focus?.lng]);
  const ref = useRef<GlobeMethods | undefined>(undefined);
  const [gl0, setGl0] = useState(false);
  const lastTele = useRef(0);
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const colors = COLORS;
  const objects = useMemo(() => [...markers, ...boats.map((b) => ({ ...b, boat: true }))], [markers, boats]);
  const arcs = useMemo(() => flows.flatMap((f) => {
    const a = centreOf(f.from);
    const b = f.toLat !== undefined && f.toLng !== undefined ? { lat: f.toLat, lng: f.toLng } : centreOf(f.to);
    return a && b ? [{ ...f, sLat: a.lat, sLng: a.lng, eLat: b.lat, eLng: b.lng }] : [];
  }), [flows]);
  const planeSets = useMemo(() => (["green", "amber", "red"] as const).map((st) => Object.assign(planes.filter((p) => p.status === st), { st })), [planes]);
  const [planeSize, setPlaneSize] = useState(1);
  // Phones: shrink plane icons if the frame rate drops while many planes are shown.
  useEffect(() => {
    if (!planes.length) return;
    let n = 0, raf = 0; const t0 = performance.now();
    const f = () => { n++; if (performance.now() - t0 < 2000) raf = requestAnimationFrame(f); else if (n < 50) setPlaneSize(0.6); };
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf);
  }, [planes.length > 0]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    const start = selected ? centre(selected) : null;
    g.pointOfView(start ? { ...start, altitude: 1.6 } : { lat: 50, lng: 10, altitude: 1.9 }, 0);
    const c = g.controls();
    c.autoRotate = !start;
    c.autoRotateSpeed = 0.75;
    wrap.current?.setAttribute("data-scene-ready", "true");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (rotate === undefined) return; const c = ref.current?.controls(); if (c) c.autoRotate = rotate && !still; }, [rotate, still]);
  useEffect(() => {
    if (!resetKey) return;
    ref.current?.pointOfView({ lat: 50, lng: 10, altitude: 1.9 }, 900);
  }, [resetKey]);

  // Fly to a country picked from search or the side panel.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const g = ref.current;
    const p = selected ? centre(selected) : null;
    if (!g || !p) return;
    g.controls().autoRotate = false;
    g.pointOfView({ ...p, altitude: 1.6 }, 900);
  }, [selected]);

  const cap = (f: object) => {
    const k = countryKey((f as Feat).properties.name);
    if (k === selected) return colors.sel;
    if (hotspots.has(k)) return colors.hot;
    if (fill) return fill.get(k) ?? "rgba(140,140,140,0.35)";
    if (!shade) return "rgba(255,255,255,0.04)";
    const s = shade.get(k);
    if (s === undefined) return "rgba(140,140,140,0.35)";
    return `rgba(${Math.round(30 + 200 * s)}, ${Math.round(110 + 80 * s)}, ${Math.round(220 - 150 * s)}, 0.75)`;
  };

  // Night side: a slightly larger dark shell, transparent on the sunlit half.
  useEffect(() => {
    const g = ref.current; if (!g || !dayNight) return;
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { sun: { value: new THREE.Vector3(1, 0, 0) } },
      vertexShader: "varying vec3 vN; void main(){ vN = normalize((modelMatrix * vec4(position,1.0)).xyz); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 sun; varying vec3 vN; void main(){ float d = dot(vN, normalize(sun)); float n = smoothstep(0.08, -0.12, d); float edge = (1.0 - smoothstep(0.0, 0.06, abs(d))) * 0.35; gl_FragColor = vec4(mix(vec3(0.0,0.02,0.08), vec3(1.0,0.55,0.2), edge), n * 0.62 + edge * 0.25); }",
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(100.6, 96, 64), mat);
    const set = () => { const s = sunPosition(new Date()); const c = g.getCoords(s.lat, s.lng, 0); mat.uniforms["sun"]!.value.set(c.x, c.y, c.z); };
    set(); g.scene().add(mesh);
    const t = setInterval(set, 60_000);
    return () => { clearInterval(t); g.scene().remove(mesh); mesh.geometry.dispose(); mat.dispose(); };
  }, [dayNight, gl0]);
  useEffect(() => {
    const g = ref.current; if (!g || !preset) return;
    g.controls().autoRotate = false;
    const pov = g.pointOfView();
    const p = selected ? centre(selected) : null;
    if (preset.kind === "world") g.pointOfView({ lat: 20, lng: pov.lng, altitude: 2.6 }, 1200);
    else if (preset.kind === "tilt") g.pointOfView({ lat: Math.max(-60, pov.lat - 25), lng: pov.lng, altitude: 0.7 }, 1200);
    else g.pointOfView({ ...(p ?? { lat: pov.lat, lng: pov.lng }), altitude: 0.55 }, 1400);
  }, [preset?.n]);
  const onMove = (e: { clientX: number; clientY: number }) => {
    const g = ref.current; if (!g || !onTelemetry || !wrap.current) return;
    const t = performance.now(); if (t - lastTele.current < 120) return; lastTele.current = t;
    const r = wrap.current.getBoundingClientRect();
    const c = g.toGlobeCoords(e.clientX - r.left, e.clientY - r.top);
    onTelemetry({ lat: c?.lat ?? null, lng: c?.lng ?? null, altKm: Math.round(g.pointOfView().altitude * 6371) });
  };
  const satObjs = useMemo(() => sats.map((x) => ({ ...x })), [sats]);
  const satPaths = useMemo(() => sats.map((x) => ({ pts: x.path, ahead: false, color: "rgba(140,240,255,0.55)", sat: true })), [sats]);
  const allPaths = useMemo(() => [...planePaths, ...satPaths], [planePaths, satPaths]);
  const pts = useMemo(() => [...events.map((e) => ({ ...e, _k: "acled" as const })), ...quakes.map((q) => ({ ...q, _k: "quake" as const }))], [events, quakes]);

  return (
    <div ref={wrap} onPointerMove={onTelemetry ? onMove : undefined} className="h-full w-full" onPointerDown={() => { const c = ref.current?.controls(); if (c && !rotate) c.autoRotate = false; }}>
      <Globe
        ref={ref}
        width={size.w}
        height={size.h}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={earth}
        showAtmosphere
        atmosphereColor="#7fb2ff"
        polygonsData={FEATURES}
        polygonAltitude={(f) => (countryKey((f as Feat).properties.name) === selected ? 0.03 : 0.008)}
        polygonCapColor={cap}
        polygonSideColor={() => "rgba(0,0,0,0.25)"}
        polygonStrokeColor={() => "rgba(255,255,255,0.35)"}
        polygonLabel={(f) => { const n = (f as Feat).properties.name; return labels?.get(countryKey(n)) ?? n; }}
        onPolygonClick={(f) => { const n = (f as Feat).properties.name; onSelect(countryKey(n), n); }}
        polygonsTransitionDuration={200}
        onGlobeReady={() => setGl0(true)}
        pointsData={pts}
        pointLat={(e) => (e as { lat: number }).lat}
        pointLng={(e) => (e as { lng: number }).lng}
        pointColor={(e) => ((e as { _k: string })._k === "quake" ? "#c86bff" : "#ffb020")}
        pointAltitude={(e) => { const x = e as { _k: string; mag?: number }; return x._k === "quake" ? 0.01 + Math.max(0, (x.mag ?? 0) - 2.5) * 0.025 : 0.02; }}
        pointRadius={(e) => { const x = e as { _k: string; mag?: number }; return x._k === "quake" ? 0.15 + (x.mag ?? 0) * 0.08 : 0.25; }}
        pointLabel={(e) => { const x = e as AcledEvent & { _k: string; label?: string }; return x._k === "quake" ? x.label! : `${x.subType || x.type} — ${x.location}, ${x.date} (ACLED)`; }}
        customLayerData={satObjs}
        customThreeObject={() => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(1.1), new THREE.MeshBasicMaterial({ color: "#8cf0ff" })); return m; }}
        customThreeObjectUpdate={(o, d) => { const x = d as { lat: number; lng: number; alt: number }; Object.assign((o as THREE.Object3D).position, ref.current?.getCoords(x.lat, x.lng, x.alt) ?? {}); }}
        customLayerLabel={(d) => (d as { label: string }).label}
        objectsData={objects}
        objectLat={(m) => (m as GlobeMarker).lat}
        objectLng={(m) => (m as GlobeMarker).lng}
        objectAltitude={0.035}
        objectFacesSurfaces
        objectLabel={(m) => (m as GlobeMarker).label}
        objectThreeObject={(m) => { const x = m as GlobeMarker & { boat?: boolean }; const o = icons.current.get(x.id) ?? (x.boat ? makeBoat((x as { color?: string }).color) : makeIcon(x.kind, !!x.research)); icons.current.set(x.id, o); return o; }}
        onObjectClick={(m) => { if (!(m as { boat?: boolean }).boat) onMarker?.((m as GlobeMarker).id); }}
        arcsData={arcs}
        arcStartLat={(a) => (a as { sLat: number }).sLat}
        arcStartLng={(a) => (a as { sLng: number }).sLng}
        arcEndLat={(a) => (a as { eLat: number }).eLat}
        arcEndLng={(a) => (a as { eLng: number }).eLng}
        arcColor={(a: object) => { const c = (a as GlobeFlow).color; return [c + "33", c]; }}
        arcStroke={(a) => (a as GlobeFlow).stroke}
        arcAltitudeAutoScale={0.4}
        arcDashLength={0.35}
        arcDashGap={0.15}
        arcDashAnimateTime={still ? 0 : 2600}
        arcLabel={(a) => (a as GlobeFlow).label}
        ringsData={markers.filter((m) => !m.research)}
        ringLat={(m) => (m as GlobeMarker).lat}
        ringLng={(m) => (m as GlobeMarker).lng}
        ringColor={(m: object) => { const r = KIND[(m as GlobeMarker).kind].ring; return (t: number) => `${r}${1 - t})`; }}
        ringMaxRadius={(m) => { const k = (m as GlobeMarker).kind; return k === "war" ? 5 : k === "strike" ? 4.5 : k === "riot" ? 3.5 : 2.5; }}
        ringPropagationSpeed={2}
        ringRepeatPeriod={still ? 0 : 1400}
        labelsData={feedPins}
        labelLat={(p) => (p as { lat: number }).lat}
        labelLng={(p) => (p as { lng: number }).lng}
        labelText={(p) => { const x = p as { count: number; live: boolean }; return x.live ? "LIVE" : String(x.count); }}
        labelSize={0.9}
        labelDotRadius={(p) => ((p as { live: boolean }).live ? 0.9 : 0.6)}
        labelColor={(p) => ((p as { live: boolean }).live ? "rgba(255,70,90,0.95)" : "rgba(80,230,255,0.9)")}
        labelAltitude={0.012}
        labelResolution={2}
        labelLabel={(p) => (p as { label: string }).label}
        onLabelClick={(p) => onFeedPin?.((p as { key: string }).key)}
        particlesData={planes.length ? planeSets : []}
        particleLat={(p) => (p as GlobePlane).lat}
        particleLng={(p) => (p as GlobePlane).lng}
        particleAltitude={0.015}
        particlesColor={(set) => PLANE_C[(set as { st: GlobePlane["status"] }).st]}
        particlesSize={(set) => ((set as { st: string }).st === "green" ? 9 : 14) * planeSize}
        particlesSizeAttenuation={false}
        particlesTexture={(set: object) => planeTexture((set as { st: GlobePlane["status"] }).st)}
        particleLabel={(p) => (p as GlobePlane).label}
        onParticleClick={(p) => onPlane?.((p as GlobePlane).id)}
        pathsData={allPaths}
        pathPoints={(d) => (d as { pts: [number, number][] }).pts}
        pathPointLat={(p) => (p as [number, number])[0]}
        pathPointLng={(p) => (p as [number, number])[1]}
        pathPointAlt={(p) => (p as number[])[2] ?? 0.016}
        pathColor={(d: object) => (d as { color: string }).color}
        pathStroke={2}
        pathDashLength={(d) => ((d as { ahead: boolean }).ahead ? 0.05 : 1)}
        pathDashGap={(d: object) => ((d as { ahead: boolean }).ahead ? 0.03 : 0)}
        pathTransitionDuration={0}
      />
    </div>
  );
}
