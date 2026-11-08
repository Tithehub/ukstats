// Server-only: builds a report from saved official payloads and stores it privately.
import regular from "@/assets/fonts/Archivo-Regular.ttf?inline";
import bold from "@/assets/fonts/Archivo-Bold.ttf?inline";
import black from "@/assets/fonts/Archivo-Black.ttf?inline";
import mono from "@/assets/fonts/IBMPlexMono-Regular.ttf?inline";
import monoBold from "@/assets/fonts/IBMPlexMono-SemiBold.ttf?inline";
import ukMapPng from "@/assets/report/uk-map.png?inline";
import globePng from "@/assets/report/globe.png?inline";
import { buildReportPdf, type ReportFonts } from "@/lib/report-pdf";
import { directoryEntries } from "@/lib/directory";
import { reportPath, type ReportEdition, type ReportKind } from "@/lib/reports";
import type { StatsPayload } from "@/lib/uk-stats";
import type { WorldPayload } from "@/lib/world";
import type { UnrestPayload } from "@/lib/unrest";
import type { ReportsPayload } from "@/lib/news-reports";

export const REPORT_BUCKET = "reports";

const fromDataUrl = (u: string) => {
  const b64 = u.slice(u.indexOf(",") + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
let fonts: ReportFonts | null = null;
const getFonts = () => (fonts ??= { regular: fromDataUrl(regular), bold: fromDataUrl(bold), black: fromDataUrl(black), mono: fromDataUrl(mono), monoBold: fromDataUrl(monoBold), ukMap: fromDataUrl(ukMapPng), globe: fromDataUrl(globePng) });

/** Build one edition from the saved snapshots and store it. Returns the storage path. */
export async function generateEdition(edition: ReportEdition, kind: ReportKind, date: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const from = (supabaseAdmin.from as (t: string) => any).bind(supabaseAdmin);
  const [{ data: uk }, { data: world }, { data: travel }, { data: news }, { data: sponsorRows }] = await Promise.all([
    from("payload_cache").select("data").eq("id", "uk-stats").maybeSingle(),
    edition === "global" ? from("payload_cache").select("data").eq("id", "world-bank-v2").maybeSingle() : Promise.resolve({ data: null }),
    from("payload_cache").select("data").eq("id", "unrest-v1").maybeSingle(),
    from("payload_cache").select("data").eq("id", "news-reports-v1").maybeSingle(),
    from("sponsors").select("id,name,url,tagline,approved,active,paid,environment,starts_at,ends_at,region,regions").limit(200),
  ]);
  const sponsors = directoryEntries(sponsorRows ?? [], "live");
  const stats = (uk?.data ?? null) as StatsPayload | null;
  if (!stats?.metrics?.length) throw new Error("No saved UK figures to build a report from");
  const { bytes, pages } = await buildReportPdf({
    edition, kind, date, metrics: stats.metrics, ukSavedAt: stats.fetchedAt ?? null,
    world: (world?.data ?? null) as WorldPayload | null,
    travel: (travel?.data ?? null) as UnrestPayload | null, headlines: (news?.data ?? null) as ReportsPayload | null, sponsors, fonts: getFonts(),
  });
  const path = reportPath(edition, kind, date);
  const up = await supabaseAdmin.storage.from(REPORT_BUCKET).upload(path, bytes, { contentType: "application/pdf", upsert: true });
  if (up.error) throw new Error(up.error.message);
  await supabaseAdmin.from("report_editions").upsert({ edition, kind, report_date: date, storage_path: path, pages }, { onConflict: "edition,kind,report_date" });
  return path;
}
