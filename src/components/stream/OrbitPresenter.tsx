import { useEffect, useRef, useState } from "react";
import closed from "@/assets/stream/orbit-presenter-closed-clean.png";
import open from "@/assets/stream/orbit-presenter-open-clean.png";
import { speakLine } from "@/lib/speech.functions";
import { readVoiceKey } from "@/lib/voice-key";

const BRIDGE = "Full figures, sources and dates are on ukstats.co.uk.";
const cache = new Map<string, Promise<string | null>>();
let voiceKey: string | null | undefined;
let unauthorised = false;
function fetchLine(text: string) {
  let p = cache.get(text);
  if (!p) {
    if (voiceKey === undefined) voiceKey = readVoiceKey();
    const once = () => speakLine({ data: { text, voiceKey: voiceKey ?? null } }).then((r) => { unauthorised = r.error === "Not authorised"; return r.audio; }).catch(() => null);
    // One retry so a single failed clip doesn't leave a silent gap on air.
    p = once().then((a) => a ?? (unauthorised ? null : once()));
    // Watchdog: a voice request that never answers must not freeze the presenter.
    p = Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), 30_000))]);
    p.then((a) => { if (!a) cache.delete(text); });
    if (cache.size > 60) cache.delete(cache.keys().next().value!);
    cache.set(text, p);
  }
  return p;
}

let ctx: AudioContext | null = null;
// Only the mouth area of the "open" portrait shows through, so the face never jumps.
const MOUTH_MASK = "radial-gradient(ellipse 9% 5.5% at 50.2% 33.4%, #000 55%, transparent 100%)";

/** Orbit-layout AI presenter: mouth follows the real voice loudness; idle breathing and sway. Always labelled AI. */
export function OrbitPresenter({ line, upcoming = [], voice, onSpeak }: { line: string; upcoming?: string[]; voice: boolean; onSpeak?: (text: string) => void }) {
  const said = useRef(onSpeak); said.current = onSpeak;
  const [status, setStatus] = useState<"idle" | "preparing" | "speaking" | "blocked" | "unauthorised" | "miming">("idle");
  const mouth = useRef<HTMLImageElement>(null);
  const level = useRef(0);
  const analyser = useRef<AnalyserNode | null>(null);
  const busy = useRef(false);
  const latest = useRef(line);
  const lastSpoken = useRef("");
  const statusRef = useRef(status);
  latest.current = line;
  const queue = useRef<string[]>([]); queue.current = upcoming;
  const recent = useRef<string[]>([]);
  /** Next line to say: the screen's line if it changed, else the next queued line not said recently — so the voice never sits silent. */
  const nextLine = () => !recent.current.includes(latest.current) ? latest.current
    : (recent.current.slice(0, 3).includes(BRIDGE) ? null : BRIDGE); statusRef.current = status;

  useEffect(() => { if (voice) upcoming.forEach((t) => t && fetchLine(t)); }, [voice, upcoming.join("|")]);

  // Drive the mouth every frame from the analyser (voice) or a speech-like rhythm (no voice).
  useEffect(() => {
    let raf = 0; const buf = new Uint8Array(512);
    const tick = (t: number) => {
      let target = 0;
      const a = analyser.current;
      if (statusRef.current === "speaking" && a) {
        a.getByteTimeDomainData(buf);
        let sum = 0; for (const v of buf) { const d = (v - 128) / 128; sum += d * d; }
        target = Math.min(1, Math.sqrt(sum / buf.length) * 6);
      } else if (statusRef.current === "miming" || (statusRef.current === "speaking" && !a)) {
        target = Math.max(0, Math.sin(t / 95) * 0.5 + Math.sin(t / 37) * 0.35 + 0.15);
      }
      level.current += (target - level.current) * 0.45;
      if (mouth.current) mouth.current.style.opacity = level.current.toFixed(2);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!line || busy.current) return;
    const mime = (text: string) => {
      busy.current = true; setStatus("miming"); said.current?.(text);
      const ms = Math.min(20000, Math.max(2500, text.split(/\s+/).length * 380));
      window.setTimeout(() => {
        busy.current = false; setStatus("idle");
        if (latest.current !== lastSpoken.current) void (voice ? speak(latest.current) : mime((lastSpoken.current = latest.current)));
      }, ms);
    };
    const speak = async (text: string) => {
      busy.current = true; lastSpoken.current = text; recent.current = [text, ...recent.current].slice(0, 8); setStatus("preparing");
      const b64 = await fetchLine(text);
      if (!b64) { setStatus(unauthorised ? "unauthorised" : "idle"); mime(text); return; }
      const el = new Audio(`data:audio/wav;base64,${b64}`);
      try {
        ctx ??= new AudioContext();
        if (ctx.state === "suspended") await ctx.resume();
        const src = ctx.createMediaElementSource(el);
        const an = ctx.createAnalyser(); an.fftSize = 512;
        src.connect(an); an.connect(ctx.destination);
        analyser.current = an;
      } catch { analyser.current = null; }
      let done = false;
      const finish = () => {
        if (done) return; done = true; window.clearTimeout(guard);
        busy.current = false; analyser.current = null; setStatus("idle");
        { const n = nextLine(); if (n) void speak(n); }
      };
      // Watchdog: if the clip errors or never reports its end, move on instead of going silent.
      const guard = window.setTimeout(finish, Math.max(15_000, text.split(/\s+/).length * 600));
      el.onended = finish; el.onerror = finish;
      try { await el.play(); setStatus("speaking"); said.current?.(text); } catch { done = true; window.clearTimeout(guard); setStatus("blocked"); mime(text); }
    };
    if (voice) void speak(line); else { lastSpoken.current = line; mime(line); }
  }, [line, voice]);

  const label = !voice ? "Voice off" : status === "unauthorised" ? "Voice off — not authorised" : status === "blocked" ? "Voice blocked" : status === "preparing" ? "Preparing voice" : status === "speaking" ? "Speaking" : status === "miming" ? "Reading on screen" : "Listening";
  const fit = "absolute inset-0 h-full w-full object-contain object-bottom";
  return <div className="relative h-full w-full">
    <div className="absolute inset-0 origin-bottom motion-safe:animate-[orbit-breathe_6s_ease-in-out_infinite] drop-shadow-[0_12px_30px_oklch(0_0_0/0.6)]">
      <img src={closed} alt="UKStats AI presenter" className={fit} width={832} height={1024} />
      <img ref={mouth} src={open} alt="" aria-hidden className={fit} width={832} height={1024}
        style={{ opacity: 0, WebkitMaskImage: MOUTH_MASK, maskImage: MOUTH_MASK }} />
    </div>
    <div className="absolute bottom-[120px] left-1/2 flex -translate-x-1/2 items-center gap-2 bg-night/80 px-3 py-1 backdrop-blur-md">
      <span className={`inline-block size-3 shrink-0 rounded-full ${status === "speaking" ? "bg-destructive motion-safe:animate-pulse" : "bg-night-muted"}`} />
      <span className="whitespace-nowrap font-mono text-[15px] font-bold uppercase tracking-wide">AI presenter · {label}</span>
    </div>
  </div>;
}
