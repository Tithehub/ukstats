import { Link } from "@tanstack/react-router";
import { EXPENDITURE_CATEGORIES } from "@/lib/spending.data";

/** Direct shortcuts to every expenditure type page. */
export function SpendingTypeLinks() {
  return (
    <nav aria-label="Spending by type" className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-sm">
      <span className="font-mono text-xs uppercase text-muted-foreground">Spending by type:</span>
      {EXPENDITURE_CATEGORIES.map((c) => (
        <Link key={c.slug} to="/spending/type/$category" params={{ category: c.slug }} className="text-electric-soft underline">
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
