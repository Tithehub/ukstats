import { describe, expect, it } from 'vitest';
import { coverageGaps, metricCategory, periodEnd, observationsCsv } from './country-detail';
import { countryByCode } from './countries';
import { noFeed, parseSdmxCsv } from './national';
describe('country integrity', () => {
 it('does not invent figures to fill missing topics', () => {
   const c = countryByCode('us')!; const gaps = coverageGaps(c, []);
   expect(gaps.length).toBe(12);
   expect(gaps.every(m => m.raw === null && m.value === null && m.status === 'no-feed' && !m.history?.length)).toBe(true);
 });
 it('keeps asylum separate from irregular migration', () => {
   expect(metricCategory(noFeed('ca-asylum','Asylum','IRCC','https://canada.ca',''))).toBe('Immigration');
   expect(metricCategory(noFeed('irregular-present','Presence','Eurostat','https://ec.europa.eu',''))).toBe('Irregular immigration & cost');
 });
 it('uses the end of the reference period rather than download date', () => {
    expect(periodEnd('2025-Q2')).toBe('2025-06-30');
    expect(periodEnd('2024-02')).toBe('2024-02-29');
    expect(periodEnd('2023')).toBe('2023-12-31');
    expect(periodEnd('2026-S1')).toBe('2026-06-30');
    expect(periodEnd('2025-S2')).toBe('2025-12-31');
    expect(periodEnd(null)).toBeNull();
 });
 it('rejects truncated and missing CSV observations', () => {
   expect(parseSdmxCsv('TIME_PERIOD,OBS_VALUE\n2026-01\n2026-02,\n2026-03,2.5')).toEqual([{ time:'2026-03',value:2.5 }]);
 });
 it('exports only retrieved observations', () => {
   expect(observationsCsv(noFeed('gap','Gap','Official','https://example.com','')).split('\n')).toHaveLength(1);
 });
});
