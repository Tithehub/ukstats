import { useEffect, useRef, useState } from "react";
import closed from "@/assets/stream/orbit-presenter-closed.png";
import open from "@/assets/stream/orbit-presenter-open.png";
import { speakLine } from "@/lib/speech.functions";
import { readVoiceKey } from "@/lib/voice-key";

const cache = new Map<string, Promise<string | null>>();
let voiceKey: string | null | undefined;
let unauthorised = false;
function fetchLine(text: string) {
  let p = cache.get(text);
  if (!p) {
    if (voiceKey === undefined) voiceKey = readVoiceKey();
    p = speakLine({ data: { text, voiceKey } }).then((r) => { unauthorised = r.error === "Not authorised"; return r.audio; }).catch(() => null);
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
export function OrbitPresenter({ line, upcoming = [], voice }: { line: string; upcoming?: string[]; voice: boolean }) {
  const [status, setStatus] = useState<"idle" | "preparing" | "speaking" | "blocked" | "unauthorised" | "miming">("idle");
  const mouth = useRef<HTMLImageElement>(null);
  const level = useRef(0);
  const analyser = useRef<AnalyserNode | null>(null);
  const busy = useRef(false);
  const latest = useRef(line);
  const lastSpoken = useRef("");
  const statusRef = useRef(status);
  latest.current = line; statusRef.current = status;

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
      busy.current = true; setStatus("miming");
      const ms = Math.min(20000, Math.max(2500, text.split(/\s+/).length * 380));
      window.setTimeout(() => {
        busy.current = false; setStatus("idle");
        if (latest.current !== lastSpoken.current) void (voice ? speak(latest.current) : mime((lastSpoken.current = latest.current)));
      }, ms);
    };
    const speak = async (text: string) => {
      busy.current = true; lastSpoken.current = text; setStatus("preparing");
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
      el.onended = () => {
        busy.current = false; analyser.current = null; setStatus("idle");
        if (latest.current !== lastSpoken.current) void speak(latest.current);
      };
      try { await el.play(); setStatus("speaking"); } catch { setStatus("blocked"); mime(text); }
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
    <div className="absolute inset-x-6 bottom-0">
      <div className="bg-stream-strap px-3 py-1 text-stream-strap-fg"><span className="truncate text-[20px] font-black uppercase leading-tight">UKStats AI presenter</span></div>
      <div className="flex items-center gap-2 bg-primary px-3 py-1 text-primary-foreground">
        <span className={`inline-block size-3 shrink-0 rounded-full ${status === "speaking" ? "bg-destructive motion-safe:animate-pulse" : "bg-night-muted"}`} />
        <span className="truncate font-mono text-[15px] font-bold uppercase tracking-wide">AI · Official figures · {label}</span>
      </div>
    </div>
  </div>;
}
