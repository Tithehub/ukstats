import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NAV_GROUPS } from "./SiteHeader";

interface Item { to: string; label: string; icon: LucideIcon }

/** Site-wide page finder (Ctrl/⌘K). Lists pages only — figures live in the register search. */
export function SiteSearch({ extra = [] }: { extra?: Item[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const all = useMemo(
    () => [...NAV_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.name }))), ...extra.map((i) => ({ ...i, group: "Your account" }))],
    [extra],
  );
  const results = useMemo(() => {
    const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return all.filter((i) => words.every((w) => `${i.label} ${i.group} ${i.to}`.toLowerCase().includes(w))).slice(0, 12);
  }, [q, all]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { if (open) { setQ(""); setActive(0); setTimeout(() => input.current?.focus(), 0); } }, [open]);
  useEffect(() => setActive(0), [q]);

  const go = (to: string) => { setOpen(false); void navigate({ to }); };

  return (
    <>
      <Button variant="ghost" size="icon" type="button" title="Search UKStats (Ctrl+K)" aria-label="Search UKStats" onClick={() => setOpen(true)}>
        <Search />
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-night/70 p-4 pt-[10vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Search UKStats" className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                  if (e.key === "Enter" && results[active]) go(results[active].to);
                }}
                placeholder="Search pages — boats, schools, scandals…"
                aria-label="Search pages"
                className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              />
              <Button variant="ghost" size="icon" type="button" aria-label="Close search" onClick={() => setOpen(false)}><X /></Button>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-1.5">
              {results.map((r, i) => (
                <li key={r.to}>
                  <Link
                    to={r.to}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-[14px] ${i === active ? "bg-muted" : ""}`}
                  >
                    <r.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{r.label}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{r.group}</span>
                  </Link>
                </li>
              ))}
              {results.length === 0 ? <li className="px-3 py-6 text-center text-sm text-muted-foreground">No pages match. Try the <Link to="/register" onClick={() => setOpen(false)} className="underline">statistics register</Link> to search figures.</li> : null}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
