-- Portfolio curation: hide individual photos from the public site and keep an
-- explicit order. Until now every uploaded photo showed, in upload order.

alter table public.portfolio_assets
  add column visible boolean not null default true;

-- Public site portfolio: only visible photos, in the owner's chosen order.
create or replace function public.get_site_portfolio(p_handle text)
returns table (
  id          uuid,
  preview_key text,
  width       integer,
  height      integer
)
language sql
security definer set search_path = public
stable
as $$
  select pa.id, coalesce(pa.variants ->> 'preview', pa.r2_key), pa.width, pa.height
  from public.sites st
  join public.portfolio_assets pa on pa.owner_id = st.user_id
  where st.handle = p_handle and st.is_published and pa.visible
  order by pa.position, pa.created_at
  limit 48;
$$;
