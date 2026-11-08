import { Link } from "@tanstack/react-router";
import { GraduationCap, School, University } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OfstedRecord } from "@/lib/education";
import { fmtDate } from "@/lib/uk-stats";

export function EduNav() {
  return (
    <nav aria-label="Education sections" className="mt-6 flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm"><Link to="/education" activeOptions={{ exact: true }} activeProps={{ "aria-current": "page" }}><GraduationCap />Overview</Link></Button>
      <Button asChild variant="outline" size="sm"><Link to="/education/schools" search={{}}><School />Find a school</Link></Button>
      <Button asChild variant="outline" size="sm"><Link to="/education/universities" search={{}}><University />Universities</Link></Button>
    </nav>
  );
}

export const fmtNum = (n: number | null | undefined, digits = 0) =>
  n == null ? null : n.toLocaleString("en-GB", { maximumFractionDigits: digits, minimumFractionDigits: digits });

export function Figure({ value, suffix }: { value: string | null; suffix?: string }) {
  return value == null ? <span className="text-night-muted">Not published</span> : <span className="font-mono">{value}{suffix}</span>;
}

/** Ofsted's own words for the latest outcome — framework always named, never converted. */
export function OfstedSummaryLine({ o }: { o: OfstedRecord | null }) {
  if (!o || !o.framework) return <span className="text-night-muted">No inspection on Ofsted's list</span>;
  if (o.framework === "report card") {
    const ach = o.grades.find((g) => g.area === "Achievement")?.grade;
    return <span>Report card{ach ? <> · Achievement: <strong>{ach}</strong></> : null} <span className="text-night-muted">({fmtDate(o.inspected)})</span></span>;
  }
  return <span>{o.framework === "graded" ? "Graded inspection" : "Ungraded inspection"}: <strong>{o.headline ?? "—"}</strong> <span className="text-night-muted">({fmtDate(o.inspected)})</span></span>;
}

export function SourceNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-xs text-night-muted">{children}</p>;
}
