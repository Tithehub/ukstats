import { Link } from "@tanstack/react-router";
import { ExternalLink, Newspaper } from "lucide-react";
import { FEATURED_STORY } from "@/lib/featured-story.data";
import { fmtDate } from "@/lib/uk-stats";

/** Main press story — verbatim headline/standfirst, credited to the publisher. Not an official statistic. */
export function FeaturedStory() {
  const s = FEATURED_STORY;
  if (!s) return null;
  return (
    <section aria-label="Main story" className="mt-8">
      <article className="rounded-2xl border-4 border-primary bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-onair-readable px-3 py-1 text-xs font-black uppercase tracking-widest text-desk-fg"><Newspaper className="size-4" />Main story</span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">In the news — press coverage, not an official statistic</span>
        </div>
        <h2 className="mt-4 text-2xl font-black leading-tight sm:text-3xl">“{s.headline}”</h2>
        <p className="mt-2 text-base text-muted-foreground">“{s.standfirst}”</p>
        <p className="mt-3 font-mono text-xs text-muted-foreground">Source: <strong className="text-foreground">{s.publisher}</strong> · {fmtDate(s.published)}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Read on FT.com <ExternalLink className="size-4" /></a>
          <Link to="/restore-britain" search={{ kind: "all", q: "", page: 1 }} className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-bold">About Restore Britain</Link>
        </div>
      </article>
    </section>
  );
}
