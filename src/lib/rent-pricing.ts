// White-label ("Rent UKStats") pricing. Customers pay for branding and hosting, never for figures.
export type RentProduct = "widgets" | "dashboard" | "stream" | "api_small" | "api_large";
export type Presenter = "ai" | "self" | "none";
export type RentLayout = "classic" | "data-wall" | "split" | "portrait";

export const PRODUCT_PRICES: Record<RentProduct, { label: string; pence: number }> = {
  widgets: { label: "Branded widgets", pence: 2900 },
  dashboard: { label: "Branded dashboard page", pence: 9900 },
  stream: { label: "Branded screen / stream", pence: 19900 },
  api_small: { label: "Data feed API (10k requests)", pence: 4900 },
  api_large: { label: "Data feed API (250k requests)", pence: 24900 },
};
export const SUBDOMAIN_PENCE = 5000;
export const EXTRA_COUNTRY_PENCE = 2500;
export const WHOLE_PACKAGE_PENCE = 39900;
export const AI_PRESENTER_PENCE = 5000;
export const FOUNDING_DISCOUNT = 0.25;

export interface RentConfig {
  products: RentProduct[];
  /** Number of countries chosen; ignored when wholePackage. */
  countries: number;
  wholePackage: boolean;
  presenter: Presenter;
  subdomain: boolean;
  founding: boolean;
}

/** Monthly price in pence. One country included; presenter only applies to the stream. */
export function monthlyPence(c: RentConfig): number {
  let total = c.products.reduce((s, p) => s + PRODUCT_PRICES[p].pence, 0);
  if (c.subdomain && c.products.includes("dashboard")) total += SUBDOMAIN_PENCE;
  total += c.wholePackage ? WHOLE_PACKAGE_PENCE : Math.max(0, c.countries - 1) * EXTRA_COUNTRY_PENCE;
  if (c.presenter === "ai" && c.products.includes("stream")) total += AI_PRESENTER_PENCE;
  if (c.founding) total = Math.round(total * (1 - FOUNDING_DISCOUNT));
  return total;
}

export const gbp = (pence: number) => `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: pence % 100 ? 2 : 0 })}`;
