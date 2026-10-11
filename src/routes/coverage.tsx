import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Newspaper, Send, X } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import {
  getMediaMentions,
  listPendingMentions,
  setMentionApproval,
  submitMediaMention,
  type MediaMention,
} from "@/lib/media.functions";

const URL = "https://ukstats.co.uk/coverage";
const TITLE = "Media coverage — UKStats";
const DESC =
  "Where mainstream and alternative media have cited UKStats, the UK National Data Register. Outlets can submit their coverage for listing.";

export const Route = createFileRoute("/coverage")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: CoveragePage,
});

function MentionCard({ m }: { m: MediaMention }) {
  return (
    <a
      href={m.url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-night-line/60 bg-night-panel/40 transition-colors hover:border-electric"
    >
      {m.image_url ? (
        <img src={m.image_url} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-night-panel">
          <Newspaper className="h-8 w-8 text-night-muted" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">{m.outlet}</span>
        <span className="line-clamp-3 text-[14px] font-semibold leading-snug group-hover:underline">{m.title}</span>
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[12px] text-night-muted">
          {new Date(m.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </a>
  );
}

function SubmitForm({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState("");
  const [outlet, setOutlet] = useState("");
  const [title, setTitle] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError("");
    try {
      await submitMediaMention({ data: { url, outlet, title } });
      setState("sent");
      onDone();
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-xl border border-electric/40 bg-night-panel/40 p-5 text-[14px]">
        <p className="flex items-center gap-2 font-semibold"><Check className="h-4 w-4 text-electric" /> Thank you — submission received.</p>
        <p className="mt-1 text-night-muted">It will appear here once our team has checked it. Usually within a day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-night-line/60 bg-night-panel/40 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-[13px]">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Outlet name</span>
          <input
            required
            value={outlet}
            onChange={(e) => setOutlet(e.target.value)}
            placeholder="e.g. The Example Gazette"
            className="min-h-11 rounded-lg border border-night-line/60 bg-background px-3 text-[14px]"
          />
        </label>
        <label className="grid gap-1 text-[13px]">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Article title</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline of the piece"
            className="min-h-11 rounded-lg border border-night-line/60 bg-background px-3 text-[14px]"
          />
        </label>
      </div>
      <label className="grid gap-1 text-[13px]">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Link to the article</span>
        <input
          required
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="min-h-11 rounded-lg border border-night-line/60 bg-background px-3 text-[14px]"
        />
      </label>
      {state === "error" && <p className="text-[13px] text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={state === "busy"}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-electric px-4 text-[14px] font-semibold text-background hover:opacity-90 disabled:opacity-50"
      >
        <Send className="h-4 w-4" /> {state === "busy" ? "Submitting…" : "Submit coverage"}
      </button>
      <p className="text-[12px] text-night-muted">
        We fetch the article's thumbnail automatically. Submissions are reviewed before appearing — no spam, no
        self-promotion unrelated to UKStats.
      </p>
    </form>
  );
}

function AdminQueue() {
  const [pending, setPending] = useState<MediaMention[] | null>(null);

  const load = useCallback(async () => {
    try {
      setPending(await listPendingMentions());
    } catch {
      setPending(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!pending || pending.length === 0) return null;

  async function act(id: string, action: "approve" | "reject") {
    await setMentionApproval({ data: { id, action } });
    setPending((p) => (p ?? []).filter((m) => m.id !== id));
  }

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-semibold">Awaiting review</h2>
      <div className="grid gap-3">
        {pending.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-night-line/60 bg-night-panel/40 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{m.title}</p>
              <p className="truncate text-[12px] text-night-muted">{m.outlet} — {m.url}</p>
            </div>
            <button
              type="button"
              onClick={() => void act(m.id, "approve")}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-electric px-3 text-[13px] font-semibold text-background"
            >
              <Check className="h-4 w-4" /> Approve
            </button>
            <button
              type="button"
              onClick={() => void act(m.id, "reject")}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-night-line/60 px-3 text-[13px]"
            >
              <X className="h-4 w-4" /> Reject
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CoveragePage() {
  const [mentions, setMentions] = useState<MediaMention[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(async () => {
    setMentions(await getMediaMentions());
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: ok } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      setIsAdmin(ok === true);
    });
  }, [load]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-electric">In the news</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Media coverage</h1>
        <p className="mt-4 max-w-2xl text-night-muted">
          Where mainstream and alternative media have cited UKStats. Published something that uses our figures?
          Submit it below and it will appear here once reviewed.
        </p>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Submit your coverage</h2>
          <SubmitForm onDone={() => void load()} />
        </section>

        {isAdmin && <AdminQueue />}

        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">Published coverage</h2>
          {loaded && mentions.length === 0 ? (
            <p className="rounded-xl border border-night-line/60 bg-night-panel/40 p-5 text-[14px] text-night-muted">
              No published coverage yet — be the first to cite UKStats and submit your piece above.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mentions.map((m) => (
                <MentionCard key={m.id} m={m} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
