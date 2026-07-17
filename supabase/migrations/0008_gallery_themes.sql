-- ============================================================================
-- Gallery styles. NULL = inherit from the photographer's site (the
-- "Site + Galleries" bundle looks seamless); a set value overrides per
-- gallery. Values are theme-catalog entries — «опівніч» is tysha+night.
-- ============================================================================

alter table public.galleries
  add column theme text
    check (theme in ('tysha', 'opivnich', 'povitria', 'plivka', 'zhurnal', 'galereia', 'arkhiv', 'prodakshn'));

-- Branding RPC also reports the owner's site theme/mode so the public page
-- can resolve inheritance without exposing the sites table to anon.
drop function if exists public.get_gallery_branding(text);
create function public.get_gallery_branding(gallery_slug text)
returns table (
  display_name text,
  logo_key     text,
  plan         text,
  site_theme   text,
  site_mode    text
)
language sql
security definer set search_path = public
stable
as $$
  select p.display_name, p.logo_url, p.plan, st.theme, st.mode
  from public.galleries g
  join public.profiles p on p.user_id = g.owner_id
  left join public.sites st on st.user_id = g.owner_id
  where g.slug = gallery_slug
    and g.is_published
    and (g.expires_at is null or g.expires_at > now());
$$;
