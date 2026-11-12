import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareResult({ text, url }: { text: string; url: string }) {
  const [msg, setMsg] = useState("");
  const share = async () => {
    const full = `${text}\n${url}`;
    try {
      if (navigator.share) { await navigator.share({ text, url }); return; }
      await navigator.clipboard.writeText(full); setMsg("Copied — paste it anywhere");
    } catch { /* cancelled */ }
  };
  const enc = encodeURIComponent(`${text}\n${url}`);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={share}><Share2 />Share / challenge a friend</Button>
      <Button asChild variant="outline"><a href={`https://wa.me/?text=${enc}`} target="_blank" rel="noreferrer">WhatsApp</a></Button>
      <Button asChild variant="outline"><a href={`https://x.com/intent/post?text=${enc}`} target="_blank" rel="noreferrer">X</a></Button>
      {msg && <span className="text-sm text-night-muted" role="status">{msg}</span>}
    </div>
  );
}
