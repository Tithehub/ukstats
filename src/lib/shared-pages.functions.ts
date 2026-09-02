import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { tierById } from "./tiers";

export interface SharedPage {
  slug: string;
  title: string;
  metricIds: string[];
  tier: string;
  pricePence: number;
  paymentStatus: string;
  expiresAt: string;
  createdAt: string;
  viewCount: number;
}

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function makeSlug(title: string): string {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "uk-stats";
  const rand = Math.random().toString(36).slice(2, 7);
  return `${base}-${rand}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function row2page(r: any): SharedPage {
  return {
    slug: r.slug,
    title: r.title,
    metricIds: r.metric_ids ?? [],
    tier: r.tier,
    pricePence: r.price_pence,
    paymentStatus: r.payment_status,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
    viewCount: r.view_count,
  };
}

export const createSharedPage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        title: z.string().min(1).max(120),
        metricIds: z.array(z.string().min(1).max(64)).min(1).max(40),
        tier: z.string().min(1).max(32),
        ownerToken: z.string().min(16).max(128),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const tier = tierById(data.tier);
    if (!tier) throw new Error("Unknown duration tier");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Paid tiers start as a 60-minute preview; crypto confirmation extends
    // the page to the full purchased duration.
    const paid = tier.pricePence > 0;
    const initialHours = paid ? 1 : tier.hours;
    const expiresAt = new Date(Date.now() + initialHours * 3_600_000).toISOString();
    const ownerHash = await hashToken(data.ownerToken);

    const { data: row, error } = await supabaseAdmin
      .from("shared_pages")
      .insert({
        slug: makeSlug(data.title),
        title: data.title,
        metric_ids: data.metricIds,
        tier: tier.id,
        duration_hours: tier.hours,
        price_pence: tier.pricePence,
        payment_status: tier.pricePence === 0 ? "free" : "pending",
        expires_at: expiresAt,
        owner_hash: ownerHash,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row2page(row);
  });

export const getSharedPage = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("shared_pages")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();

    if (!row) return { page: null, expired: false as const };
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      return { page: row2page(row), expired: true as const };
    }
    await supabaseAdmin
      .from("shared_pages")
      .update({ view_count: (row.view_count ?? 0) + 1 })
      .eq("id", row.id);
    return { page: row2page(row), expired: false as const };
  });

export const listOwnedPages = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ ownerToken: z.string().min(16).max(128) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ownerHash = await hashToken(data.ownerToken);
    const { data: rows } = await supabaseAdmin
      .from("shared_pages")
      .select("*")
      .eq("owner_hash", ownerHash)
      .order("created_at", { ascending: false });
    return (rows ?? []).map(row2page);
  });

export const extendSharedPage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        slug: z.string().min(1).max(80),
        tier: z.string().min(1).max(32),
        ownerToken: z.string().min(16).max(128),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const tier = tierById(data.tier);
    if (!tier) throw new Error("Unknown duration tier");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ownerHash = await hashToken(data.ownerToken);
    const { data: row } = await supabaseAdmin
      .from("shared_pages")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();

    if (!row || row.owner_hash !== ownerHash) throw new Error("Not your page");

    const from = Math.max(Date.now(), new Date(row.expires_at).getTime());
    const { data: updated, error } = await supabaseAdmin
      .from("shared_pages")
      .update({
        expires_at: new Date(from + tier.hours * 3_600_000).toISOString(),
        tier: tier.id,
        duration_hours: tier.hours,
        price_pence: tier.pricePence,
        payment_status: tier.pricePence === 0 ? "free" : "pending",
      })
      .eq("id", row.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row2page(updated);
  });
