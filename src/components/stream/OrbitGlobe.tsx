import { useEffect, useRef } from "react";
import * as THREE from "three";
import { feature } from "topojson-client";
import topo from "world-atlas/countries-110m.json";
import dayUrl from "@/assets/earth-blue-marble.jpg";
import nightUrl from "@/assets/earth-night-lights.jpg";
import cloudsUrl from "@/assets/earth-clouds-alpha.jpg";
import { countryKey } from "@/lib/unrest";

const outlines = (feature(topo as never, topo.objects.countries as never) as unknown as {
  features: { properties: { name: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } }[];
}).features;

function targetFor(country: string) {
  const f = outlines.find((x) => countryKey(x.properties.name) === countryKey(country));
  const polys = f?.geometry.type === "Polygon" ? [f.geometry.coordinates as number[][][]] : f?.geometry.coordinates as number[][][][] | undefined;
  const ring = polys?.map((p) => p[0] ?? []).sort((a, b) => b.length - a.length)[0];
  let lat = 50, lng = 0;
  if (ring?.length) {
    lat = ring.reduce((n, p) => n + (p[1] ?? 0), 0) / ring.length;
    lng = ring.reduce((n, p) => n + (p[0] ?? 0), 0) / ring.length;
  }
  const phi = THREE.MathUtils.degToRad(lat), theta = THREE.MathUtils.degToRad(lng);
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta)), new THREE.Vector3(0, 0, 1));
}

const onSphere = (lng: number, lat: number, r: number) => {
  const phi = THREE.MathUtils.degToRad(lat), theta = THREE.MathUtils.degToRad(lng);
  return [Math.cos(phi) * Math.sin(theta) * r, Math.sin(phi) * r, Math.cos(phi) * Math.cos(theta) * r];
};
/** Border line segments for the given countries (all when no filter), lifted just above the surface. */
function borders(filter: ((name: string) => boolean) | null, r: number) {
  const pos: number[] = [];
  for (const f of outlines) {
    if (filter && !filter(f.properties.name)) continue;
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates as number[][][]] : f.geometry.coordinates as number[][][][];
    for (const poly of polys) for (const ring of poly) for (let i = 1; i < ring.length; i++) pos.push(...onSphere(ring[i - 1]![0]!, ring[i - 1]![1]!, r), ...onSphere(ring[i]![0]!, ring[i]![1]!, r));
  }
  return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
}
function labelTexture(text: string) {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 160; const g = c.getContext("2d")!;
  g.font = "700 72px Archivo, sans-serif"; const w = Math.min(1000, g.measureText(text).width + 90);
  g.fillStyle = "rgba(5,29,63,0.72)"; g.beginPath(); g.roundRect((1024 - w) / 2, 20, w, 120, 18); g.fill();
  g.strokeStyle = "rgba(255,61,84,0.95)"; g.lineWidth = 5; g.stroke();
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 512, 82);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Draft newsroom globe: real Earth textures, cinematic night lighting, no statistical layers. */
export default function OrbitGlobe({ country }: { country: string }) {
  const host = useRef<HTMLDivElement>(null);
  const target = useRef(targetFor(country));
  const focus = useRef<((c: string) => void) | null>(null);
  useEffect(() => { target.current = targetFor(country); focus.current?.(country); }, [country]);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
    camera.position.z = 3.65;
    const css = getComputedStyle(el);
    const blue = new THREE.Color(css.getPropertyValue("--orbit-atmosphere").trim());
    const red = new THREE.Color(css.getPropertyValue("--orbit-streak").trim());
    const loader = new THREE.TextureLoader();
    const day = loader.load(dayUrl), night = loader.load(nightUrl), clouds = loader.load(cloudsUrl);
    day.anisotropy = night.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const geometry = new THREE.SphereGeometry(1, 128, 96);
    const surface = new THREE.ShaderMaterial({
      uniforms: { dayT: { value: day }, nightT: { value: night }, sweep: { value: -2 } },
      vertexShader: "varying vec2 vUv; varying vec3 vN; void main(){vUv=uv;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      // Colourful newsroom look: land lifted to electric blue/teal, oceans deep navy, warm gold city glow, moving light sweep.
      fragmentShader: "uniform sampler2D dayT;uniform sampler2D nightT;uniform float sweep;varying vec2 vUv;varying vec3 vN;void main(){vec3 land=texture2D(dayT,vUv).rgb;vec3 night=texture2D(nightT,vUv).rgb;float city=max(0.0,night.r-max(night.b*0.72,night.g*0.55));float rim=pow(1.0-max(vN.z,0.0),3.2);float light=0.5+0.5*max(dot(normalize(vN),normalize(vec3(0.45,0.7,0.6))),0.0);vec3 c=land*vec3(0.18,0.34,0.72)*light+vec3(1.0,0.78,0.38)*min(vec3(1.4,1.0,0.5),vec3(1.0,0.72,0.3)*pow(city,0.75)*12.0)+vec3(1.0,0.6,0.25)*smoothstep(0.02,0.25,city)*0.35;float s=exp(-pow((vN.x+vN.y*0.4-sweep)*3.5,2.0));c+=vec3(0.3,0.55,1.0)*s*0.18;float sun=pow(max(dot(normalize(vN),normalize(vec3(0.6,0.65,0.45))),0.0),6.0);c+=vec3(1.0,0.8,0.5)*sun*0.32;c+=vec3(0.2,0.58,1.0)*pow(rim,0.9)*1.9;gl_FragColor=vec4(c,1.0);}",
    });
    const group = new THREE.Group();
    const earth = new THREE.Mesh(geometry, surface); earth.rotation.y = -Math.PI / 2;
    group.add(earth); group.quaternion.copy(target.current); scene.add(group);
    const cloudMaterial = new THREE.MeshBasicMaterial({ color: blue, alphaMap: clouds, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending });
    const cloudShell = new THREE.Mesh(geometry, cloudMaterial); cloudShell.scale.setScalar(1.008); cloudShell.rotation.y = earth.rotation.y; group.add(cloudShell);
    const atmosphere = new THREE.ShaderMaterial({
      uniforms: { tint: { value: blue } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      vertexShader: "varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.0);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",
      fragmentShader: "uniform vec3 tint;varying vec3 n;varying vec3 v;void main(){float a=pow(max(0.0,0.82+dot(n,v)),3.0);gl_FragColor=vec4(tint,a*1.9);}",
    });
    const haze = new THREE.Mesh(geometry, atmosphere); haze.scale.setScalar(1.11); scene.add(haze);
    const glowTex = (inner: string, outer: string) => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!; const r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, inner); r.addColorStop(1, outer); g.fillStyle = r; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); };
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("rgba(90,170,255,0.55)", "rgba(20,60,160,0)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    halo.scale.setScalar(3.4); halo.position.z = -0.6; scene.add(halo);
    const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("rgba(255,235,210,0.9)", "rgba(255,120,80,0)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    flare.scale.setScalar(1.1); flare.position.set(0.82, 0.8, -0.3); scene.add(flare);
    const headTex = glowTex("rgba(255,255,255,1)", "rgba(255,40,70,0)");
    const dustGeo = new THREE.BufferGeometry(); const dust = new Float32Array(900);
    for (let i = 0; i < 900; i += 3) { dust[i] = (Math.random() - 0.5) * 8; dust[i + 1] = (Math.random() - 0.5) * 5; dust[i + 2] = -1 - Math.random() * 3; }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dust, 3));
    const dustPts = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: blue, size: 0.012, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(dustPts);
    const pulse = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.07, 64), new THREE.MeshBasicMaterial({ color: red, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pulse.position.z = 1.02; scene.add(pulse);
    const pin = new THREE.Sprite(new THREE.SpriteMaterial({ map: headTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); pin.scale.setScalar(0.09); pin.position.z = 1.03; scene.add(pin);
    // Glowing coastlines/borders for every country, plus a red highlighted border and name label for the reported one.
    const allBorders = new THREE.LineSegments(borders(null, 1.002), new THREE.LineBasicMaterial({ color: blue, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    group.add(allBorders);
    const hot = new THREE.Group(); group.add(hot);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false }));
    label.scale.set(0.5, 0.078, 1); label.position.set(-0.1, -0.42, 1.05); scene.add(label);
    let arrivedAt = -1;
    focus.current = (name: string) => {
      hot.children.slice().forEach((o) => { hot.remove(o); const l = o as THREE.LineSegments; l.geometry.dispose(); (l.material as THREE.Material).dispose(); });
      const known = outlines.some((x) => countryKey(x.properties.name) === countryKey(name));
      if (known) {
        const geo = borders((n) => countryKey(n) === countryKey(name), 1.004);
        hot.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: red, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false })));
        const wide = new THREE.LineSegments(geo.clone(), new THREE.LineBasicMaterial({ color: red, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); wide.scale.setScalar(1.003); hot.add(wide);
      }
      label.material.map?.dispose(); label.material.map = labelTexture(name.replace(/\b\w/g, (m) => m.toUpperCase())); label.material.needsUpdate = true;
      arrivedAt = -1;
    };
    focus.current(country);
    // Decorative city network (no data): thin glowing great-circle arcs with travelling lights and gold city blooms.
    const CITIES: [number, number][] = [[-0.13, 51.5], [2.35, 48.86], [13.4, 52.52], [-3.7, 40.42], [12.5, 41.9], [37.6, 55.75], [-74, 40.7], [-118.2, 34.05], [-79.4, 43.65], [28.98, 41.0], [31.24, 30.04], [55.3, 25.2], [77.2, 28.6], [116.4, 39.9], [139.7, 35.7], [103.8, 1.35], [151.2, -33.9], [-46.6, -23.5], [18.4, -33.9], [-99.1, 19.4], [-6.26, 53.35], [10.75, 59.9]];
    const PAIRS: [number, number][] = [[0, 6], [0, 1], [0, 5], [1, 10], [2, 13], [0, 11], [11, 12], [12, 15], [15, 16], [13, 14], [6, 7], [6, 17], [8, 0], [3, 17], [4, 9], [9, 11], [1, 18], [7, 14], [20, 6], [21, 2], [19, 6]];
    const gold = new THREE.Color(1, 0.78, 0.4);
    const bloomTex = glowTex("rgba(255,215,140,0.95)", "rgba(255,150,60,0)");
    const arcs: { pts: THREE.Vector3[]; head: THREE.Sprite; off: number }[] = [];
    const vec = (c: [number, number]) => new THREE.Vector3(...(onSphere(c[0], c[1], 1) as [number, number, number]));
    for (const c of CITIES) { const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: bloomTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.95 })); b.position.copy(vec(c).multiplyScalar(1.006)); b.scale.setScalar(0.11); group.add(b); }
    PAIRS.forEach(([i, j], k) => {
      const A = vec(CITIES[i]!), B = vec(CITIES[j]!); const ang = A.angleTo(B);
      const pts = Array.from({ length: 65 }, (_, n) => { const t = n / 64; const p = A.clone().multiplyScalar(Math.sin((1 - t) * ang)).add(B.clone().multiplyScalar(Math.sin(t * ang))).divideScalar(Math.sin(ang)); return p.normalize().multiplyScalar(1.004 + Math.sin(t * Math.PI) * ang * 0.09); });
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: k % 3 ? blue : gold, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })));
      const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: bloomTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); head.scale.setScalar(0.05); group.add(head);
      arcs.push({ pts, head, off: k * 0.37 });
    });
    const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("rgba(255,220,170,0.7)", "rgba(255,140,60,0)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sunGlow.scale.setScalar(1.1); sunGlow.position.set(0.7, 0.72, -0.4); scene.add(sunGlow);
    const rings: { group: THREE.Group; head: THREE.Sprite; radius: number; speed: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const radius = 1.16 + i * 0.13;
      const points = Array.from({ length: 241 }, (_, j) => { const a = j / 240 * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0); });
      const ring = new THREE.Group(); ring.rotation.set(1.15 + i * 0.12, 0.2 - i * 0.22, -0.35 + i * 0.5);
      ring.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: blue, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending })));
      const streak = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.004, 6, 160, 1.1), new THREE.MeshBasicMaterial({ color: red, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })); ring.add(streak);
      const glow = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.016, 8, 160, 1.1), new THREE.MeshBasicMaterial({ color: red, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })); ring.add(glow);
      const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: headTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); head.scale.setScalar(0.11); ring.add(head);
      scene.add(ring); rings.push({ group: ring, head, radius, speed: (0.16 + i * 0.05) * (i % 2 ? -1 : 1) });
    }
    const resize = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = 0;
    const draw = (t: number) => {
      const delta = last ? Math.min((t - last) / 1000, 0.5) : 0.016; last = t;
      group.quaternion.slerp(target.current, reduced ? 1 : 1 - Math.exp(-delta * 1.8));
      if (!reduced) cloudShell.rotation.y += delta * 0.008;
      const sec = t / 1000;
      rings.forEach(({ group: ring, head, radius, speed }) => { const a = reduced ? 0 : sec * speed; const tip = speed > 0 ? a + 1.1 : a; head.position.set(Math.cos(tip) * radius, Math.sin(tip) * radius, 0); for (const streak of ring.children.slice(1, 3)) streak.rotation.z = a; });
      // Pulse, pin and label land once the globe has arrived at the country.
      const near = group.quaternion.angleTo(target.current) < 0.06;
      if (near && arrivedAt < 0) arrivedAt = sec;
      if (!near) arrivedAt = -1;
      const shown = arrivedAt < 0 ? 0 : Math.min(1, (sec - arrivedAt) / 0.6);
      (label.material as THREE.SpriteMaterial).opacity = shown; (pin.material as THREE.SpriteMaterial).opacity = shown;
      hot.children.forEach((o, i) => { ((o as THREE.LineSegments).material as THREE.LineBasicMaterial).opacity = (i ? 0.5 : 1) * (0.7 + 0.3 * Math.sin(sec * 3)); });
      if (!reduced) surface.uniforms["sweep"]!.value = ((sec * 0.18) % 2.6) - 1.3;
      if (!reduced && arrivedAt >= 0) { const p = ((sec - arrivedAt) % 2.4) / 2.4; pulse.scale.setScalar(1 + p * 4); (pulse.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - p); } else (pulse.material as THREE.MeshBasicMaterial).opacity = 0;
      arcs.forEach(({ pts, head, off }) => { const t = reduced ? 0.5 : ((sec * 0.22 + off) % 1); head.position.copy(pts[Math.floor(t * (pts.length - 1))]!); (head.material as THREE.SpriteMaterial).opacity = Math.sin(t * Math.PI); });
      if (!reduced) { dustPts.rotation.y = sec * 0.01; (flare.material as THREE.SpriteMaterial).opacity = 0.75 + 0.25 * Math.sin(sec * 0.8); }
      renderer.render(scene, camera); raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { focus.current = null; cancelAnimationFrame(raf); observer.disconnect(); scene.traverse((o) => { if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Points || o instanceof THREE.Sprite) { if (!(o instanceof THREE.Sprite)) o.geometry.dispose(); const mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach((m) => { (m as THREE.SpriteMaterial).map?.dispose(); m.dispose(); }); } }); day.dispose(); night.dispose(); clouds.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, []);
  return <div ref={host} className="h-full w-full" aria-label={`Animated newsroom globe focused on ${country}`} />;
}