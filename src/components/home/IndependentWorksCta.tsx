import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import cover from "@/assets/grooming-gang-cover-up-book.jpg.asset.json";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const btn = "inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-bold";

/** Independent (non-official) works — links only, no figures taken from them. */
export function IndependentWorksCta() {
  return (
    <section aria-label="Grooming gangs: inquiry and book" className="mt-8">
      <div className="grid gap-3 md:grid-cols-2">
        <article className="flex flex-col justify-between rounded-2xl border-4 border-onair bg-card p-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Independent inquiry — not an official source</p>
            <h2 className="mt-2 text-2xl font-black leading-tight">The Rape Gang Inquiry</h2>
            <p className="mt-1 text-sm text-muted-foreground">Rupert Lowe MP and Restore Britain</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <a {...ext} href="https://www.therapeganginquiry.org/" className={`${btn} bg-onair text-onair-foreground`}>Visit the inquiry <ExternalLink className="size-4" /></a>
            <a {...ext} href="https://restorebritain.substack.com/p/an-important-announcement-from-rupert" className={`${btn} border border-border`}>Restore Britain announcement</a>
          </div>
        </article>
        <article className="flex gap-4 rounded-2xl border-4 border-primary bg-card p-5">
          <a {...ext} href="https://www.amazon.co.uk/dp/0995584982" className="shrink-0">
            <img src={cover.url} alt="Cover of The Grooming Gang Cover-Up" width={400} height={511} loading="lazy" className="h-40 w-auto rounded sm:h-48" />
          </a>
          <div className="flex min-w-0 flex-col justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Independent book — not an official source</p>
              <h2 className="mt-2 text-xl font-black leading-tight">The Grooming Gang Cover-Up</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tommy Robinson and Peter McLoughlin</p>
              <p className="mt-1 text-xs text-muted-foreground">Amazon No.1 bestseller, according to the book's website</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a {...ext} href="https://www.amazon.co.uk/dp/0995584982" className={`${btn} bg-primary text-primary-foreground`}>Buy on Amazon UK <ExternalLink className="size-4" /></a>
              <a {...ext} href="https://groominggang.com/" className={`${btn} border border-border`}>Book website</a>
            </div>
          </div>
        </article>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        More in our <Link to="/grooming-gangs-inquiry" className="underline">Grooming Gangs Inquiry</Link> section. No figures on this site are taken from these works.
      </p>
    </section>
  );
}
