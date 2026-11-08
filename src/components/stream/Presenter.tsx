import { useEffect, useRef, useState } from "react";
import cutout from "@/assets/stream/presenter_cutout.png.asset.json";
import talking from "@/assets/stream/presenter_cutout_talking.webm.asset.json";
import { speakLine } from "@/lib/speech.functions";

import { readVoiceKey } from "@/lib/voice-key";

type Status = "idle" | "preparing" | "speaking" | "blocked" | "unauthorised";
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

/** AI presenter box: reads the current card's line without cutting off mid-sentence; always labelled as AI. */
export function Presenter({ line, upcoming = [], voice }: { line: string; upcoming?: string[]; voice: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [miming, setMiming] = useState(false);
  const busy = useRef(false);
  const latest = useRef(line);
  const lastSpoken = useRef("");
  latest.current = line;

  useEffect(() => { if (voice) upcoming.forEach((t) => t && fetchLine(t)); }, [voice, upcoming.join("|")]);

  useEffect(() => {
    if (!voice || !line || busy.current) return;
    const speak = async (text: string) => {
      busy.current = true; lastSpoken.current = text;
      setStatus("preparing");
      const b64 = await fetchLine(text);
      if (!b64) {
        setStatus(unauthorised ? "unauthorised" : "idle");
        if (unauthorised) try { parent.postMessage({ type: "ukstats-voice", ok: false }, location.origin); } catch { /* ignore */ }
        mime(text);
        return;
      }
      const a = new Audio(`data:audio/wav;base64,${b64}`);
      a.onended = () => {
        busy.current = false; setStatus("idle");
        if (latest.current !== lastSpoken.current) void speak(latest.current);
      };
      try { await a.play(); setStatus("speaking"); }
      catch { setStatus("blocked"); mime(text); }
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
  const label = !voice ? "Voice off" : status === "unauthorised" ? "Voice off — not authorised" : status === "blocked" ? "Voice blocked" : status === "preparing" ? "Preparing voice" : speaking ? "Speaking" : "Listening";
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
        <span className={`inline-block size-3 shrink-0 rounded-full ${speaking ? "bg-destructive motion-safe:animate-pulse" : status === "blocked" ? "bg-destructive" : "bg-night-muted"}`} />
        <span className="truncate font-mono text-[15px] font-bold uppercase tracking-wide">Official figures · {label}</span>
      </div>
    </div>
  </div>;
}
