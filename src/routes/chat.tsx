import { createFileRoute, redirect } from "@tanstack/react-router";
import { CHAT_ENABLED } from "@/lib/chat-flag";
import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { checkMessage, cleanName, KEEP_MESSAGES, MAX_MESSAGE, MAX_NAME } from "@/lib/chat-moderation";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "UKStats live chat — talk about the figures" },
      { name: "description", content: "A live visitor chat on UKStats. Messages are not saved and disappear when you leave." },
      { property: "og:title", content: "UKStats live chat" },
      { property: "og:description", content: "Talk with other visitors about UK official statistics. Nothing is saved." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => { if (!CHAT_ENABLED) throw redirect({ to: "/" }); },
  component: ChatPage,
});

interface Msg { id: string; name: string; text: string; at: number; mine?: boolean }
const NAME_KEY = "ukstats-chat-name";
const time = (t: number) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

function ChatPage() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [online, setOnline] = useState(0);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const channel = useRef<RealtimeChannel | null>(null);
  const last = useRef<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { setName(localStorage.getItem(NAME_KEY) ?? ""); }, []);

  useEffect(() => {
    if (!joined) return;
    const ch = supabase.channel("ukstats-chat", { config: { broadcast: { self: false }, presence: { key: crypto.randomUUID() } } });
    ch.on("broadcast", { event: "msg" }, ({ payload }) => {
      const m = payload as Msg;
      if (typeof m?.text !== "string" || typeof m?.name !== "string") return;
      const c = checkMessage(m.text, null, 0);
      if (!c.ok) return;
      setMsgs((p) => [...p, { id: String(m.id), name: cleanName(m.name) || "Guest", text: c.text, at: Date.now() }].slice(-KEEP_MESSAGES));
    })
      .on("presence", { event: "sync" }, () => setOnline(Object.keys(ch.presenceState()).length))
      .subscribe((s) => { if (s === "SUBSCRIBED") void ch.track({ online: true }); else if (s === "CHANNEL_ERROR") setError("Couldn't connect to the chat. Try refreshing."); });
    channel.current = ch;
    input.current?.focus();
    return () => { void supabase.removeChannel(ch); channel.current = null; };
  }, [joined]);

  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [msgs]);

  function join(e: React.FormEvent) {
    e.preventDefault();
    const n = cleanName(name);
    if (n.length < 2) { setError("Pick a name of at least 2 letters."); return; }
    localStorage.setItem(NAME_KEY, n); setName(n); setError(null); setJoined(true);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const now = Date.now();
    const c = checkMessage(draft, last.current, now);
    if (!c.ok) { setError(c.reason); return; }
    const m: Msg = { id: crypto.randomUUID(), name, text: c.text, at: now };
    const r = await channel.current?.send({ type: "broadcast", event: "msg", payload: m });
    if (r !== "ok") { setError("Message didn't send. Check your connection."); return; }
    last.current = now; setError(null); setDraft("");
    setMsgs((p) => [...p, { ...m, mine: true }].slice(-KEEP_MESSAGES));
    input.current?.focus();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Live chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">Talk with other visitors. Messages are not saved — they disappear when you leave. Be civil: no abuse, no links, one message every 3 seconds. Visitors' views are their own, not UKStats or Restore Britain.</p>

        {!joined ? (
          <form onSubmit={join} className="mt-6 flex flex-wrap items-end gap-2 rounded-md border border-border p-4">
            <label className="flex flex-1 flex-col gap-1 text-sm">Your chat name
              <input value={name} maxLength={MAX_NAME} onChange={(e) => setName(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3" autoFocus />
            </label>
            <Button type="submit">Join chat</Button>
          </form>
        ) : (
          <section className="mt-6 flex h-[60vh] min-h-80 flex-col rounded-md border border-border">
            <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
              <span>Chatting as <strong className="text-foreground">{name}</strong></span>
              <span>{online} online</span>
            </div>
            <div ref={box} className="flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
              {msgs.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Say hello — new messages appear here live.</p>}
              {msgs.filter((m) => !hidden.has(m.name) || m.mine).map((m) => (
                <div key={m.id} className={m.mine ? "ml-auto max-w-[80%] rounded-md bg-primary px-3 py-2 text-primary-foreground" : "max-w-[80%] rounded-md bg-muted px-3 py-2"}>
                  <div className="flex items-center gap-2 text-xs opacity-80">
                    <span className="font-semibold">{m.name}</span><span className="font-mono">{time(m.at)}</span>
                    {!m.mine && <button type="button" className="ml-auto underline" onClick={() => setHidden((s) => new Set(s).add(m.name))}>Mute</button>}
                  </div>
                  <p className="break-words text-sm">{m.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
              <input ref={input} value={draft} maxLength={MAX_MESSAGE} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" aria-label="Message" className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm" />
              <Button type="submit">Send</Button>
            </form>
          </section>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </main>
      <SiteFooter />
    </div>
  );
}
