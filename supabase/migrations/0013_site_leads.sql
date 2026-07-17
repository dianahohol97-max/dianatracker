-- Lead form on photographer sites (opt-in via sites.content.settings.leadForm).
--
-- Visitors are anonymous, so inserts go through a security-definer RPC that
-- checks the site is published AND the owner enabled the form — the table
-- itself has no insert policy. The photographer reads/deletes their own
-- leads in the dashboard.

create table public.site_leads (
  id           uuid primary key default gen_random_uuid(),
  site_user_id uuid not null references public.profiles (user_id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 120),
  contact      text not null check (char_length(contact) between 1 and 200),
  message      text not null default '' check (char_length(message) <= 2000),
  created_at   timestamptz not null default now()
);

create index site_leads_owner_idx on public.site_leads (site_user_id, created_at desc);

alter table public.site_leads enable row level security;

create policy "site_leads: owner read"
  on public.site_leads for select
  using (auth.uid() = site_user_id);

create policy "site_leads: owner delete"
  on public.site_leads for delete
  using (auth.uid() = site_user_id);

-- Anon-callable on purpose: this is the public submit path, same access
-- model as the other get_*/record_* RPCs.
create or replace function public.record_site_lead(
  p_handle  text,
  p_name    text,
  p_contact text,
  p_message text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
begin
  select st.user_id into v_owner
  from public.sites st
  where st.handle = p_handle
    and st.is_published
    and coalesce((st.content -> 'settings' ->> 'leadForm')::boolean, false);

  if v_owner is null then
    raise exception 'lead form is not available for this site';
  end if;

  insert into public.site_leads (site_user_id, name, contact, message)
  values (
    v_owner,
    left(trim(p_name), 120),
    left(trim(p_contact), 200),
    left(coalesce(trim(p_message), ''), 2000)
  );
end;
$$;
