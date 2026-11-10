import { useEffect, useRef } from "react";
import * as THREE from "three";
import { feature } from "topojson-client";
import topo from "world-atlas/countries-110m.json";
import dayUrl from "@/assets/earth-blue-marble.jpg";
import nightUrl from "@/assets/earth-night-lights.jpg";
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

/** Draft newsroom globe: real Earth textures, cinematic night lighting, no statistical layers. */
export default function OrbitGlobe({ country }: { country: string }) {
  const host = useRef<HTMLDivElement>(null);
  const target = useRef(targetFor(country));
  useEffect(() => { target.current = targetFor(country); }, [country]);
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
    const day = loader.load(dayUrl), night = loader.load(nightUrl);
    day.anisotropy = night.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const geometry = new THREE.SphereGeometry(1, 128, 96);
    const surface = new THREE.ShaderMaterial({
      uniforms: { dayT: { value: day }, nightT: { value: night } },
      vertexShader: "varying vec2 vUv; varying vec3 vN; void main(){vUv=uv;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: "uniform sampler2D dayT;uniform sampler2D nightT;varying vec2 vUv;varying vec3 vN;void main(){vec3 land=texture2D(dayT,vUv).rgb;vec3 night=texture2D(nightT,vUv).rgb;float city=max(0.0,night.r-max(night.b*0.72,night.g*0.55));float rim=pow(1.0-max(vN.z,0.0),2.8);vec3 c=land*vec3(0.09,0.15,0.26)+vec3(1.0,0.72,0.35)*city*4.5;c+=vec3(0.08,0.3,0.72)*rim;gl_FragColor=vec4(c,1.0);}",
    });
    const group = new THREE.Group();
    const earth = new THREE.Mesh(geometry, surface); earth.rotation.y = -Math.PI / 2;
    group.add(earth); group.quaternion.copy(target.current); scene.add(group);
    const atmosphere = new THREE.ShaderMaterial({
      uniforms: { tint: { value: blue } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      vertexShader: "varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.0);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",
      fragmentShader: "uniform vec3 tint;varying vec3 n;varying vec3 v;void main(){float a=pow(max(0.0,0.82+dot(n,v)),3.0);gl_FragColor=vec4(tint,a*1.4);}",
    });
    const haze = new THREE.Mesh(geometry, atmosphere); haze.scale.setScalar(1.065); scene.add(haze);
    const rings: { group: THREE.Group; dot: THREE.Mesh; radius: number; speed: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const radius = 1.09 + i * 0.08;
      const points = Array.from({ length: 181 }, (_, j) => { const a = j / 180 * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0); });
      const ring = new THREE.Group(); ring.rotation.set(0.45 + i * 0.65, 0.28 + i * 0.34, -0.45 + i * 0.7);
      ring.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: blue, transparent: true, opacity: 0.26 })));
      const streak = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.0025, 6, 100, 0.35), new THREE.MeshBasicMaterial({ color: red })); ring.add(streak);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 8), new THREE.MeshBasicMaterial({ color: red })); ring.add(dot);
      scene.add(ring); rings.push({ group: ring, dot, radius, speed: 0.11 + i * 0.045 });
    }
    const resize = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = 0;
    const draw = (t: number) => {
      const delta = last ? Math.min((t - last) / 1000, 0.5) : 0.016; last = t;
      group.quaternion.slerp(target.current, reduced ? 1 : 1 - Math.exp(-delta * 1.8));
      rings.forEach(({ group: ring, dot, radius, speed }) => { const a = reduced ? 0 : t / 1000 * speed; dot.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0); const streak = ring.children[1]; if (streak) streak.rotation.z = a - 0.35; });
      renderer.render(scene, camera); raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); scene.traverse((o) => { if (o instanceof THREE.Mesh || o instanceof THREE.Line) { o.geometry.dispose(); const mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach((m) => m.dispose()); } }); day.dispose(); night.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, []);
  return <div ref={host} className="h-full w-full" aria-label={`Animated newsroom globe focused on ${country}`} />;
}