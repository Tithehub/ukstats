import type { Metric } from "./uk-stats";

/** Retain only the last verified non-publication decision, never a nationality-based value. */
export function retainUnpublishedCharacteristics(current: Metric[], previous: Metric[]): Metric[] {
  return current.map(metric => {
    if (!["uk-boats-religion", "uk-boats-ethnicity"].includes(metric.id) || metric.emptyLabel === "Not published" || metric.status === "ok") return metric;
    const verified = previous.find(old => old.id === metric.id && old.emptyLabel === "Not published" && old.value === null && old.asOf);
    return verified ? { ...verified, note: `${verified.note ?? ""} The latest workbook could not be checked; this remains the last verified publication status, not a new verification.` } : metric;
  });
}