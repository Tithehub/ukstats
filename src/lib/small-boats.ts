/** Pure helpers for the Home Office small boats daily time series (table SB_01). */

export type BoatDay = { date: string; arrivals: number; boats: number };

export const SMALL_BOATS_SOURCE = {
  name: "Home Office · Migrants detected crossing the English Channel in small boats – time series",
  url: "https://www.gov.uk/government/publications/migrants-detected-crossing-the-english-channel-in-small-boats",
};

/** Prime Ministers' terms, from GOV.UK. The handover day counts for the incoming PM. */
export const PM_TERMS: { name: string; from: string; to: string | null; url: string }[] = [
  { name: "Theresa May", from: "2016-07-13", to: "2019-07-24", url: "https://www.gov.uk/government/history/past-prime-ministers/theresa-may" },
  { name: "Boris Johnson", from: "2019-07-24", to: "2022-09-06", url: "https://www.gov.uk/government/history/past-prime-ministers/boris-johnson" },
  { name: "Liz Truss", from: "2022-09-06", to: "2022-10-25", url: "https://www.gov.uk/government/history/past-prime-ministers/elizabeth-truss" },
  { name: "Rishi Sunak", from: "2022-10-25", to: "2024-07-05", url: "https://www.gov.uk/government/history/past-prime-ministers/rishi-sunak" },
  { name: "Keir Starmer", from: "2024-07-05", to: "2026-07-20", url: "https://www.gov.uk/government/history/past-prime-ministers" },
  { name: "Andy Burnham", from: "2026-07-20", to: null, url: "https://www.gov.uk/government/ministers/prime-minister" },
];

const DAY = 86_400_000;
const addDay = (iso: string) => new Date(Date.parse(iso + "T00:00:00Z") + DAY).toISOString().slice(0, 10);

/** Parse SB_01 from the spreadsheet's content.xml. Throws if the table is missing, a cell is not numeric, or a day is skipped. */
export function parseSmallBoatsXml(xml: string): BoatDay[] {
  const start = xml.indexOf('table:name="SB_01"');
  if (start < 0) throw new Error("Daily table SB_01 not found");
  const table = xml.slice(start, xml.indexOf("</table:table>", start));
  const out: BoatDay[] = [];
  for (const row of table.matchAll(/<table:table-row[^>]*>([\s\S]*?)<\/table:table-row>/g)) {
    const date = /office:date-value="(\d{4}-\d{2}-\d{2})/.exec(row[1]!)?.[1];
    if (!date) continue;
    const nums = [...row[1]!.matchAll(/<table:table-cell([^>]*)>/g)].slice(1, 3).map((c) => {
      const v = /office:value-type="float" office:value="([\d.]+)"/.exec(c[1]!);
      return v ? Number(v[1]) : NaN;
    });
    if (nums.length < 2 || !nums.every(Number.isFinite)) throw new Error(`Missing figure for ${date}`);
    if (out.length && out[out.length - 1]!.date !== date && addDay(out[out.length - 1]!.date) !== date) {
      throw new Error(`Gap in daily series before ${date}`);
    }
    out.push({ date, arrivals: nums[0]!, boats: nums[1]! });
  }
  if (!out.length) throw new Error("No daily rows in SB_01");
  return out;
}

export type PmRow = { name: string; url: string; from: string; to: string; days: number; arrivals: number; boats: number; perDay: number; partial: string | null };

/** Official totals per Prime Minister, counted only over days the series covers. */
export function pmTotals(series: BoatDay[]): PmRow[] {
  if (!series.length) return [];
  const first = series[0]!.date;
  const last = series[series.length - 1]!.date;
  return PM_TERMS.flatMap((t) => {
    const from = t.from > first ? t.from : first;
    // End is exclusive: the handover day belongs to the next PM.
    const endEx = t.to ?? addDay(last);
    const days = series.filter((d) => d.date >= from && d.date < endEx);
    if (!days.length) return [];
    const arrivals = days.reduce((a, d) => a + d.arrivals, 0);
    const boats = days.reduce((a, d) => a + d.boats, 0);
    const notes: string[] = [];
    if (from !== t.from) notes.push(`from ${first}, when the series starts`);
    if (!t.to) notes.push(`to ${last}, the latest published day`);
    return [{ name: t.name, url: t.url, from, to: days[days.length - 1]!.date, days: days.length, arrivals, boats, perDay: arrivals / days.length, partial: notes.length ? notes.join("; ") : null }];
  });
}

const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** Monthly totals, labelled like "2026 OCT"; the latest month may be partial. */
export function monthlyTotals(series: BoatDay[]): { label: string; value: number; formatted: string; updated: null }[] {
  const m = new Map<string, number>();
  for (const d of series) {
    const k = `${d.date.slice(0, 4)} ${MON[Number(d.date.slice(5, 7)) - 1]}`;
    m.set(k, (m.get(k) ?? 0) + d.arrivals);
  }
  return [...m].map(([label, value]) => ({ label, value, formatted: value.toLocaleString("en-GB"), updated: null }));
}

export function yearlyTotals(series: BoatDay[]): { year: string; arrivals: number; boats: number; days: number }[] {
  const m = new Map<string, { arrivals: number; boats: number; days: number }>();
  for (const d of series) {
    const y = d.date.slice(0, 4);
    const r = m.get(y) ?? { arrivals: 0, boats: 0, days: 0 };
    r.arrivals += d.arrivals; r.boats += d.boats; r.days += 1;
    m.set(y, r);
  }
  return [...m].map(([year, r]) => ({ year, ...r }));
}

export function toCsv(series: BoatDay[]): string {
  return "date,migrants_arrived,boats_arrived\n" + series.map((d) => `${d.date},${d.arrivals},${d.boats}`).join("\n") + "\n";
}
