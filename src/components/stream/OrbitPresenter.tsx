import { isTurn, nextTurn, playVoice, stopVoice, voiceAnalyser } from "@/lib/voice-channel";
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

// Only the mouth area of the "open" portrait shows through, so the face never jumps.
const MOUTH_MASK = "radial-gradient(ellipse 9% 5.5% at 50.2% 33.4%, #000 55%, transparent 100%)";

/** Orbit-layout AI presenter: mouth follows the real voice loudness; idle breathing and sway. Always labelled AI. */
export function OrbitPresenter({ line, upcoming = [], voice, onSpeak, onBusy }: { line: string; upcoming?: string[]; voice: boolean; onSpeak?: (text: string) => void; onBusy?: (speaking: boolean) => void }) {
  const said = useRef(onSpeak); said.current = onSpeak;
  const [status, setStatus] = useState<"idle" | "preparing" | "speaking" | "blocked" | "unauthorised" | "miming">("idle");
  const mouth = useRef<HTMLImageElement>(null);
  const level = useRef(0);
  const analyser = useRef<AnalyserNode | null>(null);
  const busy = useRef(false);
  const cur = useRef<(() => void) | null>(null);
  const busyCb = useRef(onBusy); busyCb.current = onBusy;
  const latest = useRef(line);
  const lastSpoken = useRef("");
  const statusRef = useRef(status);
  latest.current = line;
  const queue = useRef<string[]>([]); queue.current = upcoming;
  const recent = useRef<string[]>([]);
 statusRef.current = status;

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
    if (!line) return;
    // Screen leads: a new on-screen line cuts the old clip straight away, so voice and screen never drift.
    cur.current?.(); cur.current = null; busy.current = false; if (voice) nextTurn();
    const mime = (text: string) => {
      busy.current = true; setStatus("miming"); said.current?.(text);
      const ms = Math.min(20000, Math.max(2500, text.split(/\s+/).length * 380));
      const id = window.setTimeout(() => {
        cur.current = null;
        busy.current = false; setStatus("idle");
        if (latest.current !== lastSpoken.current) void (voice ? speak(latest.current) : mime((lastSpoken.current = latest.current)));
      }, ms);
      cur.current = () => window.clearTimeout(id);
    };
    const speak = async (text: string) => {
      const t = nextTurn();
      cur.current = null;
      busy.current = true; lastSpoken.current = text; recent.current = [text, ...recent.current].slice(0, 8); setStatus("preparing");
      const b64 = await fetchLine(text);
      if (!isTurn(t)) return;
      if (!b64) { setStatus(unauthorised ? "unauthorised" : "idle"); mime(text); return; }
      // One shared page-wide player: a newer turn cancels this one, so clips can never overlap.
      let guard = 0;
      const finish = () => {
        window.clearTimeout(guard); if (!isTurn(t)) return; busyCb.current?.(false);
        busy.current = false; analyser.current = null; setStatus("idle");
        // Only fill silence with the bridge line; never read ahead of the screen.
        if (latest.current === text && !recent.current.slice(0, 3).includes(BRIDGE)) void speak(BRIDGE);
      };
      guard = window.setTimeout(() => { if (isTurn(t)) { stopVoice(); finish(); } }, Math.max(15_000, text.split(/\s+/).length * 600));
      cur.current = () => { window.clearTimeout(guard); busyCb.current?.(false); analyser.current = null; };
      const ok = await playVoice(t, `data:audio/wav;base64,${b64}`, finish);
      if (!isTurn(t)) { window.clearTimeout(guard); return; }
      if (ok) { analyser.current = voiceAnalyser(); setStatus("speaking"); busyCb.current?.(true); said.current?.(text); }
      else { window.clearTimeout(guard); setStatus("blocked"); mime(text); }
    };
    if (voice) void speak(line); else { lastSpoken.current = line; mime(line); }
  }, [line, voice]);
  useEffect(() => () => { cur.current?.(); cur.current = null; nextTurn(); }, []);

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
