import { useEffect, useRef, useState } from "react";
import presenter from "@/assets/stream/ukstats_presenter.jpg.asset.json";
import { speakLine } from "@/lib/speech.functions";

type Status = "idle" | "preparing" | "speaking" | "blocked";
const cache = new Map<string, Promise<string | null>>();
function fetchLine(text: string) {
  let p = cache.get(text);
  if (!p) {
    p = speakLine({ data: { text } }).then((r) => r.audio).catch(() => null);
    p.then((a) => { if (!a) cache.delete(text); });
    if (cache.size > 60) cache.delete(cache.keys().next().value!);
    cache.set(text, p);
  }
  return p;
}

/** AI presenter box: reads the current card's line without cutting off mid-sentence; always labelled as AI. */
export function Presenter({ line, upcoming = [], voice }: { line: string; upcoming?: string[]; voice: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
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
      if (!b64) { busy.current = false; setStatus("idle"); return; }
      const a = new Audio(`data:audio/wav;base64,${b64}`);
      a.onended = () => {
        busy.current = false; setStatus("idle");
        if (latest.current !== lastSpoken.current) void speak(latest.current);
      };
      try { await a.play(); setStatus("speaking"); }
      catch { busy.current = false; setStatus("blocked"); }
    };
    void speak(line);
  }, [line, voice]);

  const speaking = status === "speaking";
  const label = !voice ? "Voice off" : status === "blocked" ? "Voice blocked" : status === "preparing" ? "Preparing voice" : speaking ? "Speaking" : "Listening";
  return <div className="relative h-full w-full overflow-hidden rounded border-2 border-night-line bg-night">
    <img src={presenter.url} alt="AI presenter" className={`h-full w-full object-cover transition-transform duration-[9000ms] ease-linear ${speaking ? "scale-110" : "scale-100"}`} />
    <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-primary px-3 py-1 text-primary-foreground">
      <span className={`inline-block size-3 shrink-0 rounded-full ${speaking ? "bg-destructive motion-safe:animate-pulse" : status === "blocked" ? "bg-destructive" : "bg-night-muted"}`} />
      <span className="truncate font-mono text-[16px] font-bold uppercase tracking-wide">AI presenter · {label}</span>
    </div>
  </div>;
}
