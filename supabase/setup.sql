-- Presenze & Ticket Pro: database con ruoli, permessi, inviti e notifiche
-- Supabase > SQL Editor > New query > incolla TUTTO > Run.
-- Si può rieseguire senza perdere dati. Fuso orario per "oggi": Europe/Rome (cambialo in can_write_doc se serve).

-- 1) PROFILI (uno per utente, collegato all'accesso di Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'user' check (role in ('user','admin','super')),
  can_punch boolean not null default true,        -- abilitato alla timbratura
  can_edit_past boolean not null default false,   -- può modificare le timbrature passate
  can_request boolean not null default true,      -- può richiedere ferie/permessi
  active boolean not null default true,
  joined boolean not null default false,          -- ha già fatto il primo accesso
  cal_email text,
  cal_sync boolean,
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- 2) DATI (timbrature, richieste, ticket, impostazioni ditta)
create table if not exists public.docs (
  coll text not null,
  id   text not null,
  data jsonb not null default '{}'::jsonb,
  primary key (coll, id)
);
alter table public.docs enable row level security;

-- 3) NOTIFICHE (create dal database, non falsificabili dal browser)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                 -- req | decision
  ref text,                           -- id della richiesta
  from_user uuid references auth.users(id) on delete cascade,
  to_user uuid references auth.users(id) on delete cascade,   -- null = per Proprietario e Admin
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

-- 4) PULIZIA della versione precedente (se presente; ora le tabelle esistono)
drop policy if exists docs_read on public.docs;
drop policy if exists docs_write on public.docs;
drop trigger if exists docs_guard on public.docs;
drop function if exists public.docs_guard();
drop function if exists public.is_role(text[]);

-- 5) FUNZIONI DI SUPPORTO
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and active
$$;

create or replace function public.my_can(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select case when role in ('admin','super') then true
    else case p when 'punch' then can_punch when 'edit_past' then can_edit_past when 'request' then can_request else false end end
    from profiles where id = auth.uid() and active), false)
$$;

create or replace function public.can_write_doc(c text, d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.my_role()
    when 'super' then true
    when 'admin' then c <> 'settings'
    when 'user' then (d->>'uid') = auth.uid()::text and (
         (c = 'days' and public.my_can('punch')
            and ((d->>'date')::date = (now() at time zone 'Europe/Rome')::date or public.my_can('edit_past')))
      or (c = 'reqs' and (public.my_can('request') or d->>'type' in ('malattia','modifica')))
      or c = 'tix')
    else false end
$$;

-- 6) REGOLE DI ACCESSO
-- profili: ognuno vede il proprio, Proprietario e Admin vedono tutti (nessun insert/delete: i profili nascono con l'invito)
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.my_role() in ('admin','super'));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.my_role() in ('admin','super'))
  with check (id = auth.uid() or public.my_role() in ('admin','super'));

-- dati: l'utente vede solo i propri; Admin e Proprietario tutto; le impostazioni le leggono tutti
drop policy if exists docs_read on public.docs;
create policy docs_read on public.docs for select to authenticated
  using (public.my_role() in ('admin','super') or coll = 'settings'
         or (coll in ('days','reqs','tix') and data->>'uid' = auth.uid()::text));
drop policy if exists docs_ins on public.docs;
create policy docs_ins on public.docs for insert to authenticated with check (public.can_write_doc(coll, data));
drop policy if exists docs_upd on public.docs;
create policy docs_upd on public.docs for update to authenticated
  using (public.can_write_doc(coll, data)) with check (public.can_write_doc(coll, data));
drop policy if exists docs_del on public.docs;
create policy docs_del on public.docs for delete to authenticated using (public.can_write_doc(coll, data));

-- notifiche: Proprietario/Admin leggono quelle per loro, ognuno le proprie
drop policy if exists notif_read on public.notifications;
create policy notif_read on public.notifications for select to authenticated
  using ((to_user is null and public.my_role() in ('admin','super')) or to_user = auth.uid());
drop policy if exists notif_upd on public.notifications;
create policy notif_upd on public.notifications for update to authenticated
  using ((to_user is null and public.my_role() in ('admin','super')) or to_user = auth.uid())
  with check ((to_user is null and public.my_role() in ('admin','super')) or to_user = auth.uid());

-- 7) PROTEZIONI (trigger)
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := public.my_role();
begin
  if auth.uid() is null then return new; end if;            -- funzione inviti / dashboard
  new.id := old.id; new.email := old.email; new.invited_by := old.invited_by;
  new.created_at := old.created_at; new.joined := old.joined;
  if r = 'super' then
    if old.role = 'super' then new.role := 'super'; new.active := true; end if;   -- il Proprietario non si declassa
    if new.role = 'super' and old.role <> 'super' then new.role := old.role; end if;
  elsif r = 'admin' and old.id <> auth.uid() and old.role = 'user' then
    new.role := old.role;                                   -- i ruoli li cambia solo il Proprietario
  else
    if r = 'admin' and old.id <> auth.uid() then raise exception 'Permesso negato'; end if;
    new.role := old.role; new.can_punch := old.can_punch; new.can_edit_past := old.can_edit_past;
    new.can_request := old.can_request; new.active := old.active;
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles for each row execute function public.profiles_guard();

create or replace function public.docs_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if tg_op = 'DELETE' then c := old.coll; else c := new.coll; end if;
  if auth.uid() is null or coalesce(public.my_role(), '') <> 'user' or c <> 'reqs' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'INSERT' then   -- un utente non può approvarsi da solo le richieste (la malattia è registrata subito)
    new.data := jsonb_set(new.data, '{status}', to_jsonb(case when new.data->>'type' = 'malattia' then 'approved' else 'pending' end));
    return new;
  end if;
  if old.data->>'status' <> 'pending' then raise exception 'Richiesta già gestita'; end if;
  if tg_op = 'UPDATE' then
    new.data := jsonb_set(new.data, '{status}', '"pending"'::jsonb);
    return new;
  end if;
  return old;
end $$;
drop trigger if exists docs_guard on public.docs;
create trigger docs_guard before insert or update or delete on public.docs for each row execute function public.docs_guard();

create or replace function public.notif_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  new.id := old.id; new.kind := old.kind; new.ref := old.ref; new.from_user := old.from_user;
  new.to_user := old.to_user; new.message := old.message; new.created_at := old.created_at;   -- si può cambiare solo "read"
  return new;
end $$;
drop trigger if exists notif_guard on public.notifications;
create trigger notif_guard before update on public.notifications for each row execute function public.notif_guard();

-- 8) NOTIFICHE AUTOMATICHE sulle richieste
create or replace function public.reqs_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text; lbl text; per text; typ text := new.data->>'type'; st text := new.data->>'status'; u uuid;
begin
  if new.coll <> 'reqs' then return new; end if;
  -- se l'utente della richiesta non esiste più (account eliminato) non c'è nessuno da notificare
  begin u := (new.data->>'uid')::uuid; exception when others then return new; end;
  if not exists (select 1 from profiles where id = u) then return new; end if;
  select coalesce(nullif(name, ''), email) into who from profiles where id = u;
  lbl := case typ when 'ferie' then 'ferie' when 'permesso' then 'un permesso' when 'malattia' then 'malattia'
                  when 'modifica' then 'la correzione della timbratura' else typ end;
  per := case when new.data->>'from' = coalesce(new.data->>'to', new.data->>'from') then 'il ' || (new.data->>'from')
             else 'dal ' || (new.data->>'from') || ' al ' || (new.data->>'to') end;
  if tg_op = 'INSERT' and (st = 'pending' or typ = 'malattia') then
    insert into notifications(kind, ref, from_user, message)
      values ('req', new.id, u, coalesce(who, 'Un dipendente') || ' ha richiesto ' || lbl || ' ' || per);
  elsif tg_op = 'UPDATE' and old.data->>'status' = 'pending' and st in ('approved','rejected') then
    insert into notifications(kind, ref, from_user, to_user, message)
      values ('decision', new.id, auth.uid(), u,
              'La tua richiesta di ' || lbl || ' (' || (new.data->>'from') || ') è stata ' ||
              case when st = 'approved' then 'approvata' else 'rifiutata' end);
  end if;
  return new;
end $$;
drop trigger if exists docs_notify on public.docs;
create trigger docs_notify after insert or update on public.docs for each row execute function public.reqs_notify();

-- 9) NUOVI UTENTI: il primo diventa Proprietario, gli altri Utenti (poi la funzione inviti imposta ruolo e permessi)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''),
          case when exists (select 1 from profiles where role = 'super') then 'user' else 'super' end)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.handle_user_login() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles set joined = true where id = new.id and not joined;
  return new;
end $$;
drop trigger if exists on_auth_user_login on auth.users;
create trigger on_auth_user_login after update of last_sign_in_at on auth.users
  for each row when (old.last_sign_in_at is distinct from new.last_sign_in_at) execute function public.handle_user_login();

-- 10) AGGIORNAMENTI IN TEMPO REALE
do $$ begin alter publication supabase_realtime add table public.docs; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.profiles; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notifications; exception when others then null; end $$;
