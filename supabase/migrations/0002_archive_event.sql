-- Archive ("download all") is one user action — log it as a single event
-- instead of one row per asset, so download stats stay readable.
create or replace function public.record_gallery_archive(gid uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.gallery_is_public(gid) then
    return;
  end if;
  insert into public.gallery_events (gallery_id, type, meta)
    values (gid, 'download', jsonb_build_object('archive', true));
end;
$$;
