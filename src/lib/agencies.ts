// Per-country directory of official publishers, grouped by the UK register's categories.
import { CATEGORIES, type Category } from "@/lib/uk-stats";
import { countryByCode } from "@/lib/countries";
import { AGENCIES, type Agency } from "@/lib/agencies.data";

export { AGENCIES };
export type { Agency };

/** Display label: the UK "NHS & doctors" group is health everywhere else. */
export const categoryLabel = (c: Category) => (c === "NHS & doctors" ? "Health" : c === "Politics & polling" ? "Politics & elections" : c);

export type AgencyGroup = { category: Category; label: string; bodies: { name: string; url: string; publishes: string }[] };

/** Every UK category in order; a category with no verified official body has an empty list. */
export function agencyGroups(code: string): AgencyGroup[] {
  const reg = countryByCode(code);
  const rows = AGENCIES[code] ?? [];
  return CATEGORIES.map((category) => ({
    category,
    label: categoryLabel(category),
    bodies: rows
      .filter((r) => r.category === category)
      .map((r) => (r.office ? { name: reg?.office ?? "", url: reg?.officeUrl ?? "", publishes: r.publishes } : { name: r.name, url: r.url, publishes: r.publishes }))
      .filter((b) => b.name && b.url),
  }));
}

export const hostOf = (u: string) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
};
