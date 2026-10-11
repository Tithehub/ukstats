-- The admin check function is SECURITY DEFINER but Supabase's hardened defaults
-- revoke function EXECUTE from PUBLIC, so `authenticated` could not call it. That made
-- every has_role() call return NULL: the /agents dashboard showed "site admins only"
-- even for a real admin, every RLS policy built on has_role() denied access, and the
-- approval buttons threw "Admins only".
--
-- Grant execute to authenticated only. anon deliberately stays without execute: has_role
-- accepts any user_id, so exposing it publicly would let visitors probe who holds a role.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;