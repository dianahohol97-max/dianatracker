-- 0020's column-level REVOKE was ineffective: anon/authenticated hold
-- TABLE-level SELECT on galleries, which already covers every column, so a
-- column REVOKE does not reduce access. The correct pattern is to drop the
-- table-level SELECT and grant back only the non-secret columns (everything
-- except password_hash). RLS still governs which rows are visible; this governs
-- which columns. The service role is untouched — the unlock route reads the
-- hash through it, server-side.
revoke select on public.galleries from anon, authenticated;
grant select (
  id, owner_id, slug, title, description, event_date, cover_asset_id,
  has_password, expires_at, is_published, view_count, created_at, updated_at, theme
) on public.galleries to anon, authenticated;
