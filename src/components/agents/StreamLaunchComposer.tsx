import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, ExternalLink, Radio, Send } from "lucide-react";
import { listSocialAccounts, postToSocialAccounts } from "@/lib/social.functions";
import { cleanStreamLink, defaultLaunchText, shareIntents, youtubeIdFromLink, youtubeThumbnailUrls } from "@/lib/stream-launch";

export function StreamLaunchComposer() {
  const accounts = useServerFn(listSocialAccounts);
  const post = useServerFn(postToSocialAccounts);
  const acc = useQuery({ queryKey: ["social-accounts"], queryFn: () => accounts() });
  const list = (Array.isArray(acc.data) ? acc.data : []) as { id: string; platform: string; label: string }[];
  const [raw, setRaw] = useState("");
  const [text, setText] = useState(defaultLaunchText());
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ label: string; ok: boolean; url: string | null; error: string | null; picture?: boolean }[] | null>(null);
  const [copied, setCopied] = useState(false);
  const link = cleanStreamLink(raw);
  const full = link ? `${text}\n${link}` : text;

  return (
    <section className="mt-10 rounded-xl border border-night-line bg-night-panel p-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><Radio className="h-5 w-5 text-electric" aria-hidden /> Launch the livestream</h2>
      <p className="mt-1 text-[14px] text-night-muted">Paste your YouTube live link. Nothing is posted until you press a button.</p>
      <label className="mt-3 block text-[13px] font-medium">YouTube live link
        <input value={raw} onChange={(e) => { setRaw(e.target.value); setResults(null); }} placeholder="https://www.youtube.com/live/…" className="mt-1 w-full rounded-lg border border-night-line bg-night p-2 text-[14px]" />
      </label>
      {link ? (
        <img src={youtubeThumbnailUrls(youtubeIdFromLink(link) ?? "")[1]} alt="Livestream thumbnail that will post with the link" className="mt-2 w-60 rounded-lg border border-night-line" />
      ) : null}
      {raw && !link ? <p className="mt-1 text-[13px] text-overdue">That isn't a YouTube link.</p> : null}
      <label className="mt-3 block text-[13px] font-medium">Message
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={250} className="mt-1 w-full rounded-lg border border-night-line bg-night p-2 text-[14px]" />
      </label>
      <p className="text-[12px] text-night-muted">{full.length} characters (X allows 280).</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={!link || !list.length || busy} onClick={async () => {
          if (!link) return;
          setBusy(true);
          try { const r = await post({ data: { accountIds: list.map((a) => a.id), text, link } }); setResults(r.results); }
          catch (e) { setResults([{ label: "Posting", ok: false, url: null, error: e instanceof Error ? e.message : "Failed" }]); }
          finally { setBusy(false); }
        }} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-electric px-4 text-night disabled:opacity-50">
          <Send className="h-4 w-4" aria-hidden /> {busy ? "Posting…" : `Post to my ${list.length} connected account${list.length === 1 ? "" : "s"}`}
        </button>
        <button type="button" disabled={!link} onClick={async () => { await navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-night-line px-4 disabled:opacity-50"><Copy className="h-4 w-4" aria-hidden /> {copied ? "Copied" : "Copy post"}</button>
      </div>
      {!list.length ? <p className="mt-2 text-[13px] text-night-muted">No accounts connected. <a href="/connections" className="underline">Connect Bluesky, Mastodon, Telegram, Discord or Slack</a> to post in one click.</p> : null}
      {results ? (
        <ul className="mt-2 space-y-1 text-[13px]">
          {results.map((r, i) => (
            <li key={i} className={r.ok ? "text-fresh" : "text-overdue"}>
              {r.ok ? (r.picture === false ? "Posted without picture" : "Posted with picture") : "Failed"} — {r.label}{r.url ? <> · <a href={r.url} target="_blank" rel="noreferrer" className="underline">view</a></> : null}{r.error ? ` · ${r.error}` : null}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 text-[13px] font-medium">Open each site's own post box (you press post there):</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {shareIntents(text, link ?? "").map((s) => (
          <a key={s.key} href={link ? s.url : undefined} aria-disabled={!link} target="_blank" rel="noreferrer" className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-night-line px-4 ${link ? "" : "pointer-events-none opacity-50"}`}><ExternalLink className="h-4 w-4" aria-hidden /> {s.label}</a>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-night-muted">Instagram and TikTok don't accept links from other websites. Use Copy post and paste it into the app.</p>
    </section>
  );
}
