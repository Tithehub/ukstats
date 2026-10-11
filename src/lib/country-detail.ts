import type { Country, CountryMetric } from './countries';
import type { Category } from './uk-stats';

export const COUNTRY_CATEGORIES: Category[] = ['Finance', 'Cost of living', 'Housing', 'Crime', 'Population & migration', 'Immigration', 'Irregular immigration & cost', 'NHS & doctors', 'Defence & security', 'Weather', 'National alerts', 'Politics & polling'];
export function metricCategory(m: CountryMetric): Category {
  if (m.category) return m.category;
  if (/irregular|ordered-to-leave|returned|border|boats/.test(m.id)) return 'Irregular immigration & cost';
  if (/asylum|residence/.test(m.id)) return 'Immigration';
  if (/crime|homicide/.test(m.id)) return 'Crime';
  if (m.id === 'population') return 'Population & migration';
  if (/house-prices/.test(m.id)) return 'Housing';
  if (/cpi|hicp|min-wage|inflation/.test(m.id)) return 'Cost of living';
  return 'Finance';
}
export function coverageGaps(country: Country, metrics: CountryMetric[]): CountryMetric[] {
  const represented = new Set(metrics.map(metricCategory));
  return COUNTRY_CATEGORIES.filter(category => !represented.has(category)).map(category => ({
    id: `coverage-${category.toLowerCase().replace(/[^a-z]+/g, '-')}`, title: category === 'NHS & doctors' ? 'Healthcare & doctors' : category,
    category, value: null, raw: null, period: null, asOf: null, spark: [], history: [], status: 'no-feed', source: country.office, sourceUrl: country.officeUrl,
    cadence: 'Not integrated', next: 'No verified scheduled release', calendarUrl: country.officeUrl,
    note: 'No verified feed integrated for this topic yet. This does not mean the country publishes no statistics. Use the official source; no UK figure or estimate is substituted.',
  }));
}
export function countryHead(code: string, section: string, description: string) {
  const title = `${section} — ${code} | UKStats`;
  return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
}
export function observationsCsv(m: CountryMetric) {
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return ['period,value,formatted,source,source_url', ...(m.history ?? []).map(p => [p.time, p.value, p.formatted, m.source, m.sourceUrl].map(cell).join(','))].join('\n');
}
export function downloadText(text: string, name: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
export function periodEnd(period: string | null): string | null {
  if (!period) return null;
  if (/^\d{4}$/.test(period)) return `${period}-12-31`;
  const q = period.match(/^(\d{4})-?Q([1-4])$/);
  if (q) return new Date(Date.UTC(Number(q[1]), Number(q[2]) * 3, 0)).toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}$/.test(period)) return new Date(Date.UTC(Number(period.slice(0,4)), Number(period.slice(5,7)), 0)).toISOString().slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(period) ? period : null;
}
