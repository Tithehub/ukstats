import { MAX_LAG_YEARS, WORLD_INDICATORS, type WorldPayload, type WorldIndicator } from "./world";

/** Only countries in the source snapshot can be compared; at most three. */
export function comparisonCountries(data: WorldPayload, codes: string[]) {
  return [...new Set(codes.map(code => code.toUpperCase()))]
    .flatMap(code => {
      const country = data.countries.find(c => c.iso3 === code);
      return country ? [country] : [];
    }).slice(0, 3);
}

export function comparisonStatus(data: WorldPayload, indicator: WorldIndicator, codes: string[]) {
  const observations = codes.map(code => data.values[indicator.id]?.[code]);
  if (observations.some(value => !value)) return "Missing figure";
  const years = observations.flatMap(value => value ? [value.year] : []);
  const allYears = Object.values(data.values[indicator.id] ?? {}).map(value => value.year);
  const newest = Math.max(...allYears);
  if (years.some(year => newest - year > MAX_LAG_YEARS)) return "Older filing — not ranked";
  if (new Set(years).size > 1) return "Different reporting years";
  return "Same indicator and reporting year";
}

export function comparisonRows(data: WorldPayload, codes: string[]) {
  return WORLD_INDICATORS.map(indicator => ({ indicator, status: comparisonStatus(data, indicator, codes) }));
}