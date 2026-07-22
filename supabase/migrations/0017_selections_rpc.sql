-- Harden anonymous photo selections.
--
-- The previous anon policies on public.selections were gated only by
-- gallery_is_public(gallery_id), so any visitor holding the public anon key
-- could read — or DELETE — every other visitor's picks in a published gallery
-- straight through PostgREST, bypassing the client-token scoping the app does
-- in its route. Move the public read/write behind SECURITY DEFINER RPCs that
-- are scoped by the caller's own client token, and drop the table policies so
-- RLS denies all direct anon access. The owner-read policy stays untouched.

-- Toggle one selection (favorite / retouch) for an anonymous client.
create or replace function public.set_selection(
  p_slug text,
  p_asset uuid,
  p_kind text,
  p_selected boolean,
  p_token text
) returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_gallery uuid;
begin
  if coalesce(trim(p_token), '') = '' then
    raise exception 'missing_token';
  end if;
  if p_kind not in ('favorite', 'retouch') then
    raise exception 'bad_kind';
  end if;

  select g.id into v_gallery
  from public.galleries g
  where g.slug = p_slug
    and g.is_published
    and (g.expires_at is null or g.expires_at > now());
  if v_gallery is null then
    raise exception 'gallery_not_available';
  end if;

  -- The asset must actually belong to this gallery.
  if not exists (
    select 1 from public.assets a where a.id = p_asset and a.gallery_id = v_gallery
  ) then
    raise exception 'asset_not_in_gallery';
  end if;

  if p_selected then
    insert into public.selections (gallery_id, asset_id, client_token, kind)
    values (v_gallery, p_asset, p_token, p_kind)
    on conflict (asset_id, client_token, kind) do nothing;
  else
    delete from public.selections
    where asset_id = p_asset and client_token = p_token and kind = p_kind;
  end if;
end;
$function$;

-- List the calling client's own selections for a gallery.
create or replace function public.list_selections(
  p_gallery uuid,
  p_token text
) returns table(asset_id uuid, kind text)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select s.asset_id, s.kind
  from public.selections s
  where s.gallery_id = p_gallery
    and s.client_token = p_token;
$function$;

-- Remove the over-permissive anonymous table policies. RLS now default-denies
-- direct anon access; the two RPCs above are the only public path in.
drop policy if exists "selections: client read own" on public.selections;
drop policy if exists "selections: client insert in published gallery" on public.selections;
drop policy if exists "selections: client delete own" on public.selections;

revoke all on function public.set_selection(text, uuid, text, boolean, text) from public;
grant execute on function public.set_selection(text, uuid, text, boolean, text) to anon, authenticated;
revoke all on function public.list_selections(uuid, text) from public;
grant execute on function public.list_selections(uuid, text) to anon, authenticated;
