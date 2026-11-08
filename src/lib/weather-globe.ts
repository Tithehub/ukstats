/** Globe weather layer: current model readings for major cities (Open-Meteo) — pure parser + city list. */
export interface WxReading { name: string; lat: number; lng: number; tempC: number; code: number; windKmh: number; time: string }
export const WX_SOURCE = { name: "Open-Meteo", url: "https://open-meteo.com/" } as const;

export const WX_CITIES: [string, number, number][] = [
  ["London", 51.51, -0.13], ["Edinburgh", 55.95, -3.19], ["Cardiff", 51.48, -3.18], ["Belfast", 54.6, -5.93], ["Manchester", 53.48, -2.24], ["Birmingham", 52.49, -1.89],
  ["Dublin", 53.35, -6.26], ["Paris", 48.86, 2.35], ["Madrid", 40.42, -3.7], ["Lisbon", 38.72, -9.14], ["Rome", 41.9, 12.5], ["Berlin", 52.52, 13.4],
  ["Amsterdam", 52.37, 4.9], ["Brussels", 50.85, 4.35], ["Vienna", 48.21, 16.37], ["Warsaw", 52.23, 21.01], ["Stockholm", 59.33, 18.07], ["Oslo", 59.91, 10.75],
  ["Helsinki", 60.17, 24.94], ["Reykjavik", 64.15, -21.94], ["Athens", 37.98, 23.73], ["Istanbul", 41.01, 28.98], ["Kyiv", 50.45, 30.52], ["Moscow", 55.76, 37.62],
  ["Cairo", 30.04, 31.24], ["Lagos", 6.52, 3.38], ["Nairobi", -1.29, 36.82], ["Johannesburg", -26.2, 28.05], ["Cape Town", -33.92, 18.42], ["Casablanca", 33.57, -7.59],
  ["Riyadh", 24.71, 46.68], ["Dubai", 25.2, 55.27], ["Tehran", 35.69, 51.39], ["Tel Aviv", 32.09, 34.78], ["Karachi", 24.86, 67.0], ["Delhi", 28.61, 77.21],
  ["Mumbai", 19.08, 72.88], ["Dhaka", 23.81, 90.41], ["Bangkok", 13.76, 100.5], ["Singapore", 1.35, 103.82], ["Jakarta", -6.21, 106.85], ["Manila", 14.6, 120.98],
  ["Hong Kong", 22.32, 114.17], ["Beijing", 39.9, 116.4], ["Shanghai", 31.23, 121.47], ["Seoul", 37.57, 126.98], ["Tokyo", 35.68, 139.69], ["Sydney", -33.87, 151.21],
  ["Melbourne", -37.81, 144.96], ["Perth", -31.95, 115.86], ["Auckland", -36.85, 174.76], ["Honolulu", 21.31, -157.86], ["Anchorage", 61.22, -149.9], ["Vancouver", 49.28, -123.12],
  ["Los Angeles", 34.05, -118.24], ["San Francisco", 37.77, -122.42], ["Denver", 39.74, -104.99], ["Chicago", 41.88, -87.63], ["Houston", 29.76, -95.37], ["Miami", 25.76, -80.19],
  ["New York", 40.71, -74.01], ["Washington", 38.91, -77.04], ["Toronto", 43.65, -79.38], ["Montreal", 45.5, -73.57], ["Mexico City", 19.43, -99.13], ["Havana", 23.11, -82.37],
  ["Bogotá", 4.71, -74.07], ["Lima", -12.05, -77.04], ["São Paulo", -23.55, -46.63], ["Rio de Janeiro", -22.91, -43.17], ["Buenos Aires", -34.6, -58.38], ["Santiago", -33.45, -70.67],
];

/** WMO weather code → short words (Open-Meteo documentation). */
export function wxWords(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "Rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "Snow";
  if (code >= 95) return "Thunderstorm";
  return "Not stated";
}

/** Colour for a temperature in °C (cold blue → hot red). */
export function wxColor(t: number): string {
  if (t <= -10) return "#7aa7ff";
  if (t <= 0) return "#9fd4ff";
  if (t <= 10) return "#7fe3c4";
  if (t <= 20) return "#ffe066";
  if (t <= 30) return "#ffa040";
  return "#ff4d4d";
}

export function parseWx(json: unknown, cities = WX_CITIES): WxReading[] {
  const arr = Array.isArray(json) ? json : [json];
  const out: WxReading[] = [];
  arr.forEach((row, i) => {
    const c = (row as { current?: Record<string, unknown> })?.current, city = cities[i];
    if (!c || !city) return;
    const t = c["temperature_2m"], code = c["weather_code"], w = c["wind_speed_10m"];
    if (typeof t !== "number" || typeof code !== "number" || typeof c["time"] !== "string") return;
    out.push({ name: city[0], lat: city[1], lng: city[2], tempC: t, code, windKmh: typeof w === "number" ? w : NaN, time: `${c["time"]}Z` });
  });
  return out;
}
