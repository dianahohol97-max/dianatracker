-- Portfolio categories: photographers group work into named collections
-- («Весілля», «Індивідуальні», «Сім'я»…) instead of one mixed feed. Clients
-- skim for the exact type they want, which is the established best practice.
-- Free-form text so each photographer defines their own set; NULL = untagged.

alter table public.portfolio_assets
  add column if not exists category text;

-- The return signature gains a column, so the old function must be dropped
-- before recreating (Postgres cannot change OUT params in place).
drop function if exists public.get_site_portfolio(text);

create function public.get_site_portfolio(p_handle text)
returns table (
  id          uuid,
  preview_key text,
  width       integer,
  height      integer,
  category    text
)
language sql
security definer set search_path = public
stable
as $$
  select pa.id, coalesce(pa.variants ->> 'preview', pa.r2_key), pa.width, pa.height, pa.category
  from public.sites st
  join public.portfolio_assets pa on pa.owner_id = st.user_id
  where st.handle = p_handle and st.is_published and pa.visible
  order by pa.position, pa.created_at
  limit 48;
$$;
