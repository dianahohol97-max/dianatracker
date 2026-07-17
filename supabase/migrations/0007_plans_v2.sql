-- ============================================================================
-- Pricing v2: six gallery tiers + separate site plans + 7-day grace period.
-- Feature gating (branding removal, logo, video, stats, tips, support) lives
-- in code (src/lib/plans.ts); the DB only stores plan ids and limits.
-- ============================================================================

alter table public.profiles
  -- site subscriptions are a separate product with their own plan id
  add column site_plan   text not null default 'site_trial',
  -- set when a gallery subscription is canceled: limits stay until this
  -- moment, then the account is treated as free (enforced lazily on upload)
  add column grace_until timestamptz;

-- Old plan ids from the first pricing draft (nobody real is on them, but a
-- dev database may be): map to the closest new tier.
update public.profiles set plan = 'plus' where plan = 'start';

-- Branding RPC now also reports the owner's plan so PUBLIC gallery pages can
-- apply feature gates (photographer logo, platform badge) — still only safe
-- fields, still only through a published gallery.
drop function if exists public.get_gallery_branding(text);
create function public.get_gallery_branding(gallery_slug text)
returns table (
  display_name text,
  logo_key     text,
  plan         text
)
language sql
security definer set search_path = public
stable
as $$
  select p.display_name, p.logo_url, p.plan
  from public.galleries g
  join public.profiles p on p.user_id = g.owner_id
  where g.slug = gallery_slug
    and g.is_published
    and (g.expires_at is null or g.expires_at > now());
$$;
