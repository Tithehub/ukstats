import { ExternalLink } from "lucide-react";
import { FOI_LINKS, SPENDING_CHECKED } from "@/lib/spending.data";
import { sourceById } from "@/lib/spending";
import { fmtDate } from "@/lib/uk-stats";

export function SourceCard({ id }: { id: string }) {
  const s = sourceById(id);
  if (!s) return null;
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-md border border-border bg-card p-4 transition-colors hover:border-primary"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug">{s.name}</h3>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{s.covers}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 font-mono text-xs text-muted-foreground">
        <dt>Publisher</dt>
        <dd className="text-foreground">{s.publisher}</dd>
        <dt>Covers</dt>
        <dd className="text-foreground">{s.nation}</dd>
        <dt>Released</dt>
        <dd className="text-foreground">{s.cadence}</dd>
      </dl>
    </a>
  );
}

export function FoiGuide({ councilFoi }: { councilFoi?: string }) {
  return (
    <section className="rounded-md border border-border bg-muted/40 p-4">
      <h2 className="text-lg font-semibold">Can't find a figure? Ask for it</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Anyone can ask a council or government body for information it holds under the Freedom of Information Act 2000
        (in Scotland, the Freedom of Information (Scotland) Act 2002). They normally have 20 working days to reply.
        Answers are not official statistics, so we link to them but never show them as figures.
      </p>
      <ul className="mt-3 flex flex-wrap gap-3 text-sm">
        {councilFoi && <li><a className="underline" href={councilFoi} target="_blank" rel="noopener noreferrer">This council's public FOI requests (WhatDoTheyKnow)</a></li>}
        <li><a className="underline" href={FOI_LINKS.govuk} target="_blank" rel="noopener noreferrer">How to make an FOI request (GOV.UK)</a></li>
        <li><a className="underline" href={FOI_LINKS.ico} target="_blank" rel="noopener noreferrer">Your rights (Information Commissioner's Office)</a></li>
        <li><a className="underline" href={FOI_LINKS.scotland} target="_blank" rel="noopener noreferrer">Scottish Information Commissioner</a></li>
        <li><a className="underline" href={FOI_LINKS.findCouncil} target="_blank" rel="noopener noreferrer">Find any council (GOV.UK)</a></li>
      </ul>
      <p className="mt-3 font-mono text-xs text-muted-foreground">Links checked {fmtDate(SPENDING_CHECKED)}</p>
    </section>
  );
}
