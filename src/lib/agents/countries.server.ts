import { COUNTRIES } from '../countries';
import { loadCountryStats } from '../countries.server';
import type { Finding } from './findings';
/** Shared dataset cache means 30 European registers don't require 30 copies of each feed. */
export async function countryWatchdog(): Promise<{ findings: Finding[]; tracked: number }> {
  const results = await Promise.all(COUNTRIES.map(async c => {
    try {
      const stats = await loadCountryStats(c.code);
      const metrics = stats?.metrics ?? [];
      const failed = metrics.filter(m => m.status === 'unavailable');
      const gaps = metrics.filter(m => m.status === 'no-feed').length;
      const findings: Finding[] = [{ agent: 'Country Feed Watchdog', severity: failed.length ? 'warning' : 'info', title: `${c.name}: ${metrics.filter(m => m.value !== null).length} sourced figures, ${failed.length} unavailable, ${gaps} coverage gaps`, detail: failed.length ? failed.map(m => `${m.title}: ${m.note ?? 'No observation returned'}`).join('; ').slice(0, 2500) : 'Coverage gaps are not treated as broken feeds. No figures were changed.', url: `https://ukstats.co.uk/${c.code}/status` }];
      return { findings, tracked: metrics.length };
    } catch { return { findings: [{ agent: 'Country Feed Watchdog', severity: 'warning', title: `${c.name}: register check failed`, url: `https://ukstats.co.uk/${c.code}/status` }] as Finding[], tracked: 0 }; }
  }));
  return { findings: results.flatMap(r => r.findings), tracked: results.reduce((n,r) => n+r.tracked, 0) };
}
