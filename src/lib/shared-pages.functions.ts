import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_PAGE_HOURS } from "./pages";

export interface SharedPage {
  slug: string;
  title: string;
  metricIds: string[];
  expiresAt: string;
  createdAt: string;
  viewCount: number;
  claimed: boolean;
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
    expiresAt: r.expires_at,
    createdAt: r.created_at,
    viewCount: r.view_count,
    claimed: Boolean(r.user_id),
  };
}

function expiryFromNow(hours = DEFAULT_PAGE_HOURS): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

export const createSharedPage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        title: z.string().min(1).max(120),
        metricIds: z.array(z.string().min(1).max(64)).min(1).max(40),
        ownerToken: z.string().min(16).max(128),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ownerHash = await hashToken(data.ownerToken);

    const { data: row, error } = await supabaseAdmin
      .from("shared_pages")
      .insert({
        slug: makeSlug(data.title),
        title: data.title,
        metric_ids: data.metricIds,
        tier: "free",
        duration_hours: DEFAULT_PAGE_HOURS,
        price_pence: 0,
        payment_status: "free",
        expires_at: expiryFromNow(),
        owner_hash: ownerHash,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row2page(row);
  });

export const getSharedPage = createServerFn({ method: "POST" })
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

/** Anyone holding the browser owner token can keep their own page live. */
export const renewSharedPage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ slug: z.string().min(1).max(80), ownerToken: z.string().min(16).max(128) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ownerHash = await hashToken(data.ownerToken);
    const { data: row, error } = await supabaseAdmin
      .from("shared_pages")
      .update({ expires_at: expiryFromNow() })
      .eq("slug", data.slug)
      .eq("owner_hash", ownerHash)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("That page was not created in this browser.");
    return row2page(row);
  });

/** Pages already attached to the signed-in account, on any device. */
export const listAccountPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("shared_pages")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return (rows ?? []).map(row2page);
  });

/** Attach pages created anonymously in this browser to the signed-in account. */
export const claimSharedPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ ownerToken: z.string().min(16).max(128) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ownerHash = await hashToken(data.ownerToken);
    const { data: rows, error } = await supabaseAdmin
      .from("shared_pages")
      .update({ user_id: context.userId, expires_at: expiryFromNow() })
      .eq("owner_hash", ownerHash)
      .is("user_id", null)
      .select();
    if (error) throw new Error(error.message);
    return { claimed: (rows ?? []).length };
  });
