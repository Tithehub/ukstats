import { expect, it } from "vitest";
import { retainUnpublishedCharacteristics } from "./unpublished-characteristics";
import type { Metric } from "./uk-stats";
const base = { id: "uk-boats-religion", status: "unavailable", value: null, asOf: null } as Metric;
it.each(["uk-boats-religion", "uk-boats-ethnicity"])("retains verified non-publication for %s during an outage", id => {
  const verified = { ...base, id, emptyLabel: "Not published", asOf: "2026-08-27", sourceUrl: "https://www.gov.uk/government/statistical-data-sets/immigration-system-statistics-data-tables" };
  expect(retainUnpublishedCharacteristics([{ ...base, id }], [verified])[0]).toMatchObject({ value: null, emptyLabel: "Not published", asOf: "2026-08-27" });
});
it("does not invent a non-publication verification when none exists", () => {
  expect(retainUnpublishedCharacteristics([base], [])[0]?.emptyLabel).toBeUndefined();
});