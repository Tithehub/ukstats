// Server-only overnight checks for the 33 country registers: feed health and
// publisher revisions. Compares today's figures against the last stored copy —
// nothing is estimated, and a changed figure only ever becomes a finding.
import { COUNTRIES } from '../countries';
import { loadCountryStats } from '../countries.server';
import type { Finding } from './findings';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;
type Snap = { code: string; metric_id: string; title: string; value: string; period: string; source: string; source_url: string };

/** Shared dataset cache means 30 European registers don't require 30 copies of each feed. */
export async function countryWatchdog(db: Db): Promise<{ findings: Finding[]; tracked: number; revised: number }> {
  const { data: prior } = await db.from('country_metric_snapshots').select('code, metric_id, value, period');
  const before = new Map<string, { value: string | null; period: string | null }>(
    (prior ?? []).map((r: { code: string; metric_id: string; value: string | null; period: string | null }) => [
      `${r.code}|${r.metric_id}`,
      { value: r.value, period: r.period },
    ]),
  );

  const results = await Promise.all(
    COUNTRIES.map(async c => {
      try {
        const stats = await loadCountryStats(c.code);
        const metrics = stats?.metrics ?? [];
        const failed = metrics.filter(m => m.status === 'unavailable');
        const gaps = metrics.filter(m => m.status === 'no-feed').length;
        const findings: Finding[] = [
          {
            agent: 'Country Feed Watchdog',
            severity: failed.length ? 'warning' : 'info',
            title: `${c.name}: ${metrics.filter(m => m.value !== null).length} sourced figures, ${failed.length} unavailable, ${gaps} coverage gaps`,
            detail: failed.length
              ? failed.map(m => `${m.title}: ${m.note ?? 'No observation returned'}`).join('; ').slice(0, 2500)
              : 'Coverage gaps are not treated as broken feeds. No figures were changed.',
            url: `https://ukstats.co.uk/${c.code}/status`,
          },
        ];
        const revised: Finding[] = [];
        const snaps: Snap[] = [];
        for (const m of metrics) {
          if (m.status !== 'ok' || !m.value || !m.period) continue;
          snaps.push({ code: c.code, metric_id: m.id, title: m.title, value: m.value, period: m.period, source: m.source, source_url: m.sourceUrl });
          const was = before.get(`${c.code}|${m.id}`);
          if (was && was.period === m.period && was.value !== m.value) {
            revised.push({
              agent: 'Country Revision Detective',
              severity: 'info',
              metric_id: `${c.code}:${m.id}`,
              title: `${c.name}: ${m.title} revised for ${m.period}`,
              detail: `${was.value} → ${m.value} (same period, publisher revision)`,
              url: m.sourceUrl,
            });
          }
        }
        return { findings: [...findings, ...revised], snaps, revised: revised.length, tracked: metrics.length };
      } catch {
        return {
          findings: [{ agent: 'Country Feed Watchdog', severity: 'warning', title: `${c.name}: register check failed`, url: `https://ukstats.co.uk/${c.code}/status` }] as Finding[],
          snaps: [] as Snap[],
          revised: 0,
          tracked: 0,
        };
      }
    }),
  );

  const findings = results.flatMap(r => r.findings);
  const rows = results.flatMap(r => r.snaps);
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db.from('country_metric_snapshots').upsert(rows.slice(i, i + 200), { onConflict: 'code,metric_id' });
    if (error) {
      findings.push({
        agent: 'Country Revision Detective',
        severity: 'warning',
        title: 'Country figure snapshots could not be saved',
        detail: `${error.message} — revisions may not be detected until this is fixed.`,
        url: 'https://ukstats.co.uk/agents',
      });
      break;
    }
  }

  return {
    findings,
    tracked: results.reduce((n, r) => n + r.tracked, 0),
    revised: results.reduce((n, r) => n + r.revised, 0),
  };
}
