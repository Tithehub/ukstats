import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { searchPattern } from "./education";

async function publicDb() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
  }) as unknown as { from: (t: string) => any };
}

export const getEducationSummary = createServerFn({ method: "POST" }).handler(async () => {
  const { readEducationSummary } = await import("./education.server");
  return readEducationSummary();
});
export const educationSummaryQuery = () => queryOptions({ queryKey: ["education-summary"], queryFn: () => getEducationSummary(), staleTime: 30 * 60_000 });

const LIST_COLS = "id,kind,name,phase,type,type_group,la,town,postcode,pupils,low_age,high_age,ofsted,ks4,provider";

export interface EduSearch { q?: string | undefined; phase?: string | undefined; la?: string | undefined; page?: number | undefined; kind: "school" | "provider"; }

export const searchInstitutions = createServerFn({ method: "POST" })
  .inputValidator((d: EduSearch) => ({
    kind: d.kind === "provider" ? "provider" as const : "school" as const,
    q: String(d.q ?? "").slice(0, 80), phase: String(d.phase ?? "").slice(0, 60), la: String(d.la ?? "").slice(0, 80),
    page: Math.min(Math.max(1, Math.floor(Number(d.page) || 1)), 500),
  }))
  .handler(async ({ data }) => {
    const db = await publicDb();
    const size = 30;
    let q = db.from("education_institutions").select(LIST_COLS, { count: "estimated" }).eq("kind", data.kind);
    const pat = searchPattern(data.q);
    if (pat) q = q.ilike("search", pat);
    if (data.phase) q = q.eq("phase", data.phase);
    if (data.la) q = q.eq("la", data.la);
    const { data: rows, count, error } = await q.order("name").range((data.page - 1) * size, data.page * size - 1);
    if (error) return { rows: [], total: 0, page: data.page, size, error: "The school register could not be read just now." };
    return { rows: (rows ?? []) as InstitutionListRow[], total: count ?? 0, page: data.page, size, error: null as string | null };
  });

export const institutionsQuery = (s: EduSearch) => queryOptions({ queryKey: ["edu-search", s], queryFn: () => searchInstitutions({ data: s }), staleTime: 10 * 60_000 });

export const getInstitution = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => ({ id: String(d.id).slice(0, 40) }))
  .handler(async ({ data }) => {
    const db = await publicDb();
    const { data: row } = await db.from("education_institutions").select("*").eq("id", data.id).maybeSingle();
    return (row ?? null) as InstitutionRow | null;
  });
export const institutionQuery = (id: string) => queryOptions({ queryKey: ["edu-inst", id], queryFn: () => getInstitution({ data: { id } }), staleTime: 30 * 60_000 });

import type { OfstedRecord, Ks4Record, ProviderInfo } from "./education";
export interface InstitutionListRow {
  id: string; kind: string; name: string; phase: string | null; type: string | null; type_group: string | null; la: string | null; town: string | null; postcode: string | null;
  pupils: number | null; low_age: number | null; high_age: number | null; ofsted: OfstedRecord | null; ks4: Ks4Record | null; provider: ProviderInfo | null;
}
export interface InstitutionRow extends InstitutionListRow {
  nation: string; region: string | null; website: string | null; capacity: number | null; fsm_pct: number | null; gender: string | null; religious: string | null;
  admissions: string | null; trust: string | null; census_date: string | null; source_date: string | null; updated_at: string;
}
