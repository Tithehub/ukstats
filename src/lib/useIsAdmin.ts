import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

/**
 * Admin flag for the browser, so admin-only affordances can be shown.
 * Answers are cached per account for the page visit; the server still checks
 * the role on every action, so this only decides what a button does.
 */
const cache = new Map<string, boolean>();

export function useIsAdmin() {
  const { user, loading } = useAuth();
  const id = user?.id;
  const [isAdmin, setIsAdmin] = useState(() => (id ? cache.get(id) === true : false));

  useEffect(() => {
    if (loading) return;
    if (!id) {
      setIsAdmin(false);
      return;
    }
    const hit = cache.get(id);
    if (hit !== undefined) {
      setIsAdmin(hit);
      return;
    }
    let live = true;
    void (async () => {
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
