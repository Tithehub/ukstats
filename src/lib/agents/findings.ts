/**
 * Pure overnight checks. These read published figures and describe what they
 * see — they never change a figure, and they never raise an alarm for a figure
 * the site already shows as not published.
 */
import type { Metric } from "@/lib/uk-stats";

export type Finding = {
  agent: string;
  severity: "critical" | "warning" | "info";
  metric_id?: string | null;
  title: string;
  detail?: string | null;
  url?: string | null;
};

/**
 * A figure the publisher does not collect or has not published at all carries
 * its own wording (`emptyLabel`) and is already shown that way on the site, so
 * it is a note, not an alarm. A live feed that has stopped answering stays a
 * warning.
 */
export function feedWatchdog(metrics: Metric[], now = Date.now()): Finding[] {
  const out: Finding[] = [];
  for (const m of metrics) {
    if (m.status === "unavailable")
      out.push({
        agent: "Feed Watchdog",
        severity: m.emptyLabel ? "info" : "warning",
        metric_id: m.id,
        title: m.emptyLabel
          ? `${m.title}: ${m.emptyLabel}`
          : `${m.title}: source unreachable tonight`,
        detail: m.note,
        url: m.sourceUrl,
      });
    if (m.status === "ok" && m.nextDue) {
      const due = Date.parse(m.nextDue);
      const asOf = m.asOf ? Date.parse(m.asOf) : 0;
      if (!Number.isNaN(due) && now - due > 2 * 86400_000 && asOf < due)
        out.push({
          agent: "Feed Watchdog",
          severity: "warning",
          metric_id: m.id,
          title: `${m.title}: release overdue`,
          detail: `Expected ${m.nextDue.slice(0, 10)}, latest still dated ${m.asOf?.slice(0, 10) ?? "unknown"}.`,
          url: m.sourceUrl,
        });
    }
  }
  return out;
}

export function dataAuditor(metrics: Metric[], now = Date.now()): Finding[] {
  const out: Finding[] = [];
  const seen = new Set<string>();
  for (const m of metrics) {
    if (seen.has(m.id)) out.push({ agent: "Data Auditor", severity: "warning", metric_id: m.id, title: `Duplicate figure id ${m.id}` });
    seen.add(m.id);
    if (!/^https:\/\//.test(m.sourceUrl ?? ""))
      out.push({ agent: "Data Auditor", severity: "critical", metric_id: m.id, title: `${m.title}: missing or insecure source link` });
    if (m.status === "ok" && !m.value)
      out.push({ agent: "Data Auditor", severity: "warning", metric_id: m.id, title: `${m.title}: marked live but has no value` });
    if (m.status === "ok" && !m.period)
      out.push({ agent: "Data Auditor", severity: "info", metric_id: m.id, title: `${m.title}: no reference period shown` });
    if (m.asOf && Date.parse(m.asOf) > now + 86400_000)
      out.push({ agent: "Data Auditor", severity: "warning", metric_id: m.id, title: `${m.title}: publication date is in the future`, detail: m.asOf });
    const s = m.spark.filter((v) => Number.isFinite(v));
    if (s.length >= 3) {
      const last = s[s.length - 1] ?? 0, prev = s[s.length - 2] ?? 0;
      if (prev !== 0 && Math.abs(last / prev) > 10)
        out.push({ agent: "Data Auditor", severity: "warning", metric_id: m.id, title: `${m.title}: tenfold jump in latest point — check units`, detail: `${prev} → ${last}` });
    }
  }
  return out;
}
