-- ============================================================================
-- Lockdown pass after the Supabase security advisor run on the fresh
-- production project.
--
-- Postgres grants EXECUTE on new functions to PUBLIC by default, and
-- Supabase exposes every public-schema function at /rest/v1/rpc/*. The
-- get_* / book_slot / record_* RPCs are MEANT to be anon-callable (that is
-- the whole access model), but trigger bodies and owner-scoped helpers are
-- not part of the public API — close them.
-- ============================================================================

-- Trigger functions: never callable as RPCs. Triggers themselves keep
-- working — they run as the table owner, not through EXECUTE grants.
revoke execute on function public.apply_storage_delta() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- Advisor: touch_updated_at had a role-mutable search_path (it was created
-- without the `set search_path` clause the other functions carry).
alter function public.touch_updated_at() set search_path = public;

-- Owner-scoped helper: the dashboard calls it with the photographer's own
-- session (authenticated), and get_free_slots calls it internally as the
-- definer. Anon has no business invoking it for arbitrary owners — the
-- worst case is only an early slot release, but the surface is not needed.
revoke execute on function public.release_expired_slots(uuid) from public, anon;
