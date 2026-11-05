import { COUNCILS, EXPENDITURE_CATEGORIES, SPENDING_SOURCES, type Council, type Nation } from "./spending.data";

export const sourceById = (id: string) => SPENDING_SOURCES.find((s) => s.id === id);
export const categoryBySlug = (slug: string) => EXPENDITURE_CATEGORIES.find((c) => c.slug === slug);
export const councilBySlug = (slug: string) => COUNCILS.find((c) => c.slug === slug);

/** The national return a council's figures come from — never another nation's. */
export function councilSources(nation: Exclude<Nation, "UK">): string[] {
  switch (nation) {
    case "England":
      return ["eng-revenue", "eng-capital", "transparency-code"];
    case "Scotland":
      return ["scot-lfr"];
    case "Wales":
      return ["wales-outturn"];
    case "Northern Ireland":
      return ["ni-lg", "niao"];
  }
}

/** Sources for a category that apply to a given council's nation. */
export function categorySourcesFor(categorySlug: string, council: Council): string[] {
  const cat = categoryBySlug(categorySlug);
  if (!cat) return [];
  const own = new Set(councilSources(council.nation));
  return cat.sourceIds.filter((id) => own.has(id));
}

/** Match a town, city or council name. Town level resolves to the council covering it. */
export function searchCouncils(q: string): Council[] {
  const n = q.trim().toLowerCase();
  if (!n) return COUNCILS;
  return COUNCILS.filter(
    (c) => c.name.toLowerCase().includes(n) || c.places.some((p) => p.toLowerCase().includes(n)),
  );
}
