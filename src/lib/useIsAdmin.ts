import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

/**
 * Admin flag for the browser, so admin-only affordances can be shown.
 * The answer is remembered per account for the page visit and the lookup is
 * started as soon as the header renders. It never decides what a user may do:
 * every agent action re-checks the role on the server.
 */
const cache = new Map<string, boolean>();
let pending: Promise<void> | null = null;

function startCheck() {
  if (pending || typeof window === "undefined") return;
  pending = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const id = data.session?.user.id;
      if (!id) return;
      const { data: ok } = await supabase.rpc("has_role", { _user_id: id, _role: "admin" });
      cache.set(id, ok === true);
    } catch {
      // Unknown stays unknown; the hook falls back to asking again.
    }
  })();
}

export function useIsAdmin() {
  const { user, loading } = useAuth();
  const id = user?.id;
  const [isAdmin, setIsAdmin] = useState(() => (id ? cache.get(id) === true : false));
  startCheck();

  useEffect(() => {
    if (loading) return;
    if (!id) {
      setIsAdmin(false);
      return;
    }
    let live = true;
    void (async () => {
      const known = cache.get(id);
      if (known !== undefined) {
        if (live) setIsAdmin(known);
        return;
      }
      await pending;
      const prefetched = cache.get(id);
      if (prefetched !== undefined) {
        if (live) setIsAdmin(prefetched);
        return;
      }
      try {
        const { data } = await supabase.rpc("has_role", { _user_id: id, _role: "admin" });
        const ok = data === true;
        cache.set(id, ok);
        if (live) setIsAdmin(ok);
      } catch {
        if (live) setIsAdmin(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [loading, id]);

  return { isAdmin, loading };
}
