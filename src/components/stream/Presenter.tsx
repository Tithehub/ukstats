import { useEffect, useRef, useState } from "react";
import cutout from "@/assets/stream/presenter_cutout.png.asset.json";
import talking from "@/assets/stream/presenter_cutout_talking.webm.asset.json";
import { speakLine } from "@/lib/speech.functions";

import { readVoiceKey } from "@/lib/voice-key";

type Status = "idle" | "preparing" | "speaking" | "blocked" | "unauthorised";
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

/** AI presenter box: reads the current card's line without cutting off mid-sentence; always labelled as AI. */
export function Presenter({ line, upcoming = [], voice }: { line: string; upcoming?: string[]; voice: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [miming, setMiming] = useState(false);
  const busy = useRef(false);
  const latest = useRef(line);
  const lastSpoken = useRef("");
  latest.current = line;
  const queue = useRef<string[]>([]); queue.current = upcoming;
  const recent = useRef<string[]>([]);
  /** Next line to say: the screen's line if it changed, else the next queued line not said recently — so the voice never sits silent. */
  const nextLine = () => !recent.current.includes(latest.current) ? latest.current
    : (recent.current.slice(0, 3).includes(BRIDGE) ? null : BRIDGE);

  useEffect(() => { if (voice) upcoming.forEach((t) => t && fetchLine(t)); }, [voice, upcoming.join("|")]);

  useEffect(() => {
    if (!line || busy.current) return;
    const speak = async (text: string) => {
      busy.current = true; lastSpoken.current = text; recent.current = [text, ...recent.current].slice(0, 8);
      setStatus("preparing");
      const b64 = await fetchLine(text);
      if (!b64) {
        setStatus(unauthorised ? "unauthorised" : "idle");
        if (unauthorised) try { parent.postMessage({ type: "ukstats-voice", ok: false }, location.origin); } catch { /* ignore */ }
        mime(text);
        return;
      }
      const a = new Audio(`data:audio/wav;base64,${b64}`);
      let done = false;
      const finish = () => {
        if (done) return; done = true; window.clearTimeout(guard);
        busy.current = false; setStatus("idle");
        { const n = nextLine(); if (n) void speak(n); }
      };
      // Watchdog: if the clip errors or never reports its end, move on instead of going silent.
      const guard = window.setTimeout(finish, Math.max(15_000, text.split(/\s+/).length * 600));
      a.onended = finish; a.onerror = finish;
      try { await a.play(); setStatus("speaking"); }
      catch { done = true; window.clearTimeout(guard); setStatus("blocked"); mime(text); }
    };
    /** No sound available: she still visibly reads the on-screen line, timed to its length. */
    const mime = (text: string) => {
      busy.current = true; setMiming(true);
      const ms = Math.min(20000, Math.max(2500, text.split(/\s+/).length * 380));
      window.setTimeout(() => {
        setMiming(false); busy.current = false;
        if (latest.current !== lastSpoken.current) void (voice ? speak(latest.current) : mime((lastSpoken.current = latest.current)));
      }, ms);
    };
    if (voice) void speak(line);
    else { lastSpoken.current = line; mime(line); }
  }, [line, voice]);

  const speaking = status === "speaking" || miming;
  const label = !voice ? "Voice off" : status === "unauthorised" ? "Voice off — not authorised" : status === "blocked" ? "Voice blocked" : status === "preparing" ? "Preparing voice" : status === "speaking" ? "Speaking" : miming ? "Reading on screen" : "Listening";
  const fit = "absolute inset-x-0 bottom-0 h-full w-full object-contain object-bottom drop-shadow-[0_12px_30px_oklch(0_0_0/0.6)]";
  return <div className="relative h-full w-full">
    <img src={cutout.url} alt="AI presenter" className={fit} />
    <video src={talking.url} muted loop autoPlay playsInline aria-hidden
      className={`${fit} transition-opacity duration-500 ${speaking ? "opacity-100" : "opacity-0"}`} />
    <div className="absolute inset-x-6 bottom-0">
      <div className="flex items-center gap-2 bg-stream-strap px-3 py-1 text-stream-strap-fg">
        <span className="truncate text-[20px] font-black uppercase leading-tight">UKStats AI presenter</span>
      </div>
      <div className="flex items-center gap-2 bg-primary px-3 py-1 text-primary-foreground">
        <span className={`inline-block size-3 shrink-0 rounded-full ${status === "speaking" ? "bg-destructive motion-safe:animate-pulse" : status === "blocked" ? "bg-destructive" : "bg-night-muted"}`} />
        <span className="truncate font-mono text-[15px] font-bold uppercase tracking-wide">Official figures · {label}</span>
      </div>
    </div>
  </div>;
}
