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
                  when 'modifica' then 'una modifica al calendario' else typ end;
  per := case when new.data->>'from' = coalesce(new.data->>'to', new.data->>'from') then 'il ' || (new.data->>'from')
             else 'dal ' || (new.data->>'from') || ' al ' || (new.data->>'to') end;
  -- notifica agli Admin: richieste in attesa, oppure malattia registrata dall'utente stesso
  if tg_op = 'INSERT' and (st = 'pending' or (typ = 'malattia' and coalesce(new.data->>'by', new.data->>'uid') = new.data->>'uid')) then
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

-- 11) GRUPPI, TICKET ASSEGNATI, ELIMINAZIONE UTENTI (stesso contenuto di migrazione-gruppi-ticket.sql)

-- 1) Eliminare un utente che ne ha invitati altri non deve più essere bloccato
do $$ declare n text; begin
  select conname into n from pg_constraint
   where conrelid = 'public.profiles'::regclass and contype = 'f'
     and confrelid = 'auth.users'::regclass
     and conkey = array[(select attnum from pg_attribute where attrelid = 'public.profiles'::regclass and attname = 'invited_by')];
  if n is not null then execute format('alter table public.profiles drop constraint %I', n); end if;
  alter table public.profiles add constraint profiles_invited_by_fkey foreign key (invited_by) references auth.users(id) on delete set null;
end $$;

-- 2) Lettura: ognuno vede anche i ticket che gli sono stati assegnati
drop policy if exists docs_read on public.docs;
create policy docs_read on public.docs for select to authenticated
  using (public.my_role() in ('admin','super') or coll = 'settings'
         or (coll in ('days','reqs','tix') and data->>'uid' = auth.uid()::text)
         or (coll = 'tix' and coalesce(data->'assignees' ? auth.uid()::text, false)));

-- 3) Chi riceve un ticket può aggiornarlo (il trigger sotto lascia cambiare solo lo stato)
drop policy if exists docs_upd_assigned on public.docs;
create policy docs_upd_assigned on public.docs for update to authenticated
  using (coll = 'tix' and public.my_role() is not null and coalesce(data->'assignees' ? auth.uid()::text, false))
  with check (coll = 'tix' and public.my_role() is not null and coalesce(data->'assignees' ? auth.uid()::text, false));

-- 4) Protezioni: richieste (come prima) + ticket
create or replace function public.docs_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare c text; ks text[] := array['assignees','assignUsers','groups','gnames'];
begin
  if tg_op = 'DELETE' then c := old.coll; else c := new.coll; end if;
  if auth.uid() is null or coalesce(public.my_role(), '') <> 'user' or c not in ('reqs','tix') then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if c = 'tix' then
    if tg_op = 'DELETE' then return old; end if;
    if tg_op = 'INSERT' then          -- un utente non assegna i ticket ad altri
      new.data := new.data - ks;
      return new;
    end if;
    if old.data->>'uid' = auth.uid()::text then   -- ticket proprio: l'assegnazione resta quella di prima
      new.data := (new.data - ks) || coalesce((select jsonb_object_agg(k, v) from jsonb_each(old.data) e(k, v) where k = any(ks)), '{}'::jsonb);
    else                              -- ticket assegnato da un Admin: si può cambiare solo lo stato
      new.data := old.data || jsonb_build_object('status',
        case when new.data->>'status' in ('Fare','Attesa','Fatto') then new.data->>'status' else old.data->>'status' end);
    end if;
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

-- 5) Notifica a chi riceve un ticket
create or replace function public.tix_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare a text;
begin
  if new.coll <> 'tix' or jsonb_typeof(new.data->'assignees') is distinct from 'array' then return new; end if;
  for a in select jsonb_array_elements_text(new.data->'assignees') loop
    if tg_op = 'UPDATE' and coalesce(old.data->'assignees', '[]'::jsonb) ? a then continue; end if;
    begin
      if a::uuid is distinct from auth.uid() and exists (select 1 from profiles where id = a::uuid) then
        insert into notifications(kind, ref, from_user, to_user, message)
          values ('ticket', new.id, auth.uid(), a::uuid, 'Ti è stato assegnato il ticket "' || coalesce(new.data->>'title', '') || '"');
      end if;
    exception when others then null;
    end;
  end loop;
  return new;
end $$;
drop trigger if exists docs_tix_notify on public.docs;
create trigger docs_tix_notify after insert or update on public.docs for each row execute function public.tix_notify();

-- 12) NOTIFICHE PUSH (stesso contenuto di migrazione-push.sql; le chiavi vanno inserite a parte in push_config)
-- Notifiche push anche ad app chiusa. Si può rieseguire senza perdere dati.
-- Dopo averla eseguita servono ancora le 4 righe in push_config (vedi sotto) e la funzione "send-push".

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- dispositivi che hanno attivato le notifiche
create table if not exists public.push_subs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  ua text,
  created timestamptz not null default now()
);
alter table public.push_subs enable row level security;
drop policy if exists push_subs_own on public.push_subs;
create policy push_subs_own on public.push_subs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- chiavi e indirizzo della funzione: leggibili solo dal server (nessuna policy)
create table if not exists public.push_config (k text primary key, v text not null);
alter table public.push_config enable row level security;
create table if not exists public.push_log (key text primary key, at timestamptz not null default now());
alter table public.push_log enable row level security;
revoke all on public.push_config, public.push_log from anon, authenticated;

-- invio di una notifica (chiama la funzione "send-push")
create or replace function public.push_notify(p_users uuid[], p_admins boolean, p_exclude uuid, p_title text, p_body text, p_tag text default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare u text; s text;
begin
  select v into u from push_config where k = 'fn_url';
  select v into s from push_config where k = 'secret';
  if u is null or s is null then return; end if;
  perform net.http_post(
    url := u,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', s),
    body := jsonb_build_object('users', to_jsonb(coalesce(p_users, '{}'::uuid[])), 'admins', coalesce(p_admins, false),
                               'exclude', p_exclude, 'title', p_title, 'body', p_body, 'tag', p_tag, 'url', './'));
exception when others then null;
end $$;
revoke execute on function public.push_notify(uuid[], boolean, uuid, text, text, text) from public, anon, authenticated;

-- ogni notifica dell'app diventa anche una notifica push
create or replace function public.notifications_push() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.to_user is not null then
    perform push_notify(array[new.to_user], false, null, 'Presenze & Ticket Pro', new.message, 'n' || new.id::text);
  else
    perform push_notify(null, true, new.from_user, 'Presenze & Ticket Pro', new.message, 'n' || new.id::text);
  end if;
  return new;
exception when others then return new;
end $$;
drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push after insert on public.notifications for each row execute function public.notifications_push();

-- promemoria a orario: stesse regole del popup dell'app (giorni feriali, nessuna ferie/permesso/malattia approvata)
create or replace function public.push_due(p_now timestamptz default now())
returns table(user_id uuid, title text, body text, tag text)
language plpgsql security definer set search_path = public as $$
declare cfg jsonb; tz text; l timestamp; d date; m int; tin int; tout int; wk boolean;
        r record; t record; day jsonb; cov boolean; n int; due timestamptz; rem int; who uuid;
begin
  select data into cfg from docs where coll = 'settings' and id = 'company';
  tz := coalesce(nullif(cfg->>'tz', ''), 'Europe/Rome');
  l := p_now at time zone tz; d := l::date; m := extract(hour from l)::int * 60 + extract(minute from l)::int;
  wk := extract(dow from l) in (0, 6);
  tin := case when cfg->>'in' ~ '^\d{1,2}:\d{2}$' then split_part(cfg->>'in', ':', 1)::int * 60 + split_part(cfg->>'in', ':', 2)::int else 540 end;
  tout := case when cfg->>'out' ~ '^\d{1,2}:\d{2}$' then split_part(cfg->>'out', ':', 1)::int * 60 + split_part(cfg->>'out', ':', 2)::int else 1080 end;

  if not wk then
    for r in select p.id from profiles p where p.active and p.can_punch and exists (select 1 from push_subs s where s.user_id = p.id) loop
      select data into day from docs where coll = 'days' and id = r.id::text || '_' || d::text;
      select exists (select 1 from docs q where q.coll = 'reqs' and q.data->>'uid' = r.id::text and q.data->>'status' = 'approved'
                       and coalesce(q.data->>'type', '') <> 'modifica' and q.data->>'from' <= d::text
                       and coalesce(q.data->>'to', q.data->>'from') >= d::text) into cov;
      if cov then continue; end if;
      if m >= tin and m < tout and coalesce(day->>'in', '') = '' and coalesce(day->>'off', '') in ('', 'false') then
        insert into push_log(key) values ('in:' || r.id || ':' || d) on conflict do nothing;
        get diagnostics n = row_count;
        if n = 1 then user_id := r.id; title := 'Timbra l''entrata'; body := 'Non hai ancora timbrato l''entrata (orario ' || to_char(make_time(tin / 60, tin % 60, 0), 'HH24:MI') || ').'; tag := 'in'; return next; end if;
      end if;
      if m >= tout and coalesce(day->>'in', '') <> '' and coalesce(day->>'out', '') = '' then
        insert into push_log(key) values ('out:' || r.id || ':' || d) on conflict do nothing;
        get diagnostics n = row_count;
        if n = 1 then user_id := r.id; title := 'Timbra l''uscita'; body := 'Sono le ' || to_char(make_time(tout / 60, tout % 60, 0), 'HH24:MI') || ': ricordati di timbrare l''uscita.'; tag := 'out'; return next; end if;
      end if;
    end loop;
  end if;

  -- promemoria dei ticket con data, ora e "promemoria" impostati
  for t in select x.id, x.data from docs x where x.coll = 'tix' and coalesce(x.data->>'status', 'Fare') <> 'Fatto'
             and x.data->>'due' ~ '^\d{4}-\d{2}-\d{2}$' and x.data->>'time' ~ '^\d{1,2}:\d{2}$' and x.data->>'rem' ~ '^\d+$' loop
    rem := (t.data->>'rem')::int;
    if rem <= 0 then continue; end if;
    due := ((t.data->>'due') || ' ' || (t.data->>'time'))::timestamp at time zone tz;
    if p_now >= due - rem * interval '1 minute' and p_now < due + interval '30 minutes' then
      insert into push_log(key) values ('tix:' || t.id || ':' || rem) on conflict do nothing;
      get diagnostics n = row_count;
      if n = 1 then
        for who in select distinct v::uuid from (select t.data->>'uid' as v union select jsonb_array_elements_text(case when jsonb_typeof(t.data->'assignees') = 'array' then t.data->'assignees' else '[]'::jsonb end)) z
                    where v ~ '^[0-9a-f-]{36}$' loop
          user_id := who; title := 'Ticket in scadenza'; body := coalesce(t.data->>'title', '') || ' · ' || (t.data->>'due') || ' ' || (t.data->>'time'); tag := 'tix' || t.id; return next;
        end loop;
      end if;
    end if;
  end loop;
end $$;
revoke execute on function public.push_due(timestamptz) from public, anon, authenticated;

create or replace function public.push_tick() returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select * from push_due() loop
    perform push_notify(array[r.user_id], false, null, r.title, r.body, r.tag);
  end loop;
  delete from push_log where at < now() - interval '10 days';
end $$;
revoke execute on function public.push_tick() from public, anon, authenticated;

-- ogni minuto
select cron.schedule('push-tick', '* * * * *', 'select public.push_tick()');

-- Da inserire una volta sola (con i tuoi valori; la chiave privata non va mai pubblicata):
--   insert into push_config(k, v) values ('fn_url', 'https://<progetto>.supabase.co/functions/v1/send-push'),
--     ('vapid_public', '...'), ('vapid_private', '...'), ('secret', '...') on conflict (k) do update set v = excluded.v;

-- 13) Notifica di prova e niente promemoria in ferie
-- Notifica di prova + niente promemoria durante ferie/permessi/malattia (anche se la richiesta è ancora in attesa).
-- Si può rieseguire senza perdere dati. Richiede la migrazione "push" già eseguita.

create table if not exists public.push_test (user_id uuid primary key references auth.users(id) on delete cascade, due timestamptz not null);
alter table public.push_test enable row level security;
revoke all on public.push_test from anon, authenticated;

-- l'utente chiede una notifica di prova: parte entro un minuto, quando l'app è chiusa; risponde con il numero di dispositivi registrati
create or replace function public.push_test() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'Accesso richiesto'; end if;
  select count(*) into n from push_subs where user_id = auth.uid();
  if n > 0 then
    insert into push_test(user_id, due) values (auth.uid(), now() + interval '15 seconds')
      on conflict (user_id) do update set due = excluded.due;
  end if;
  return n;
end $$;
revoke execute on function public.push_test() from public, anon;
grant execute on function public.push_test() to authenticated;

-- promemoria: salta chi ha una richiesta (approvata o in attesa) che copre oggi
do $$
declare d text := pg_get_functiondef('public.push_due(timestamptz)'::regprocedure);
begin
  if position('q.data->>''status'' = ''approved''' in d) > 0 then
    d := replace(d, 'q.data->>''status'' = ''approved''', 'q.data->>''status'' in (''approved'', ''pending'')');
    execute d;
  end if;
end $$;

create or replace function public.push_tick() returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select * from push_due() loop
    perform push_notify(array[r.user_id], false, null, r.title, r.body, r.tag);
  end loop;
  for r in delete from push_test where due <= now() returning user_id loop
    perform push_notify(array[r.user_id], false, null, 'Notifica di prova', 'Le notifiche funzionano ✅', 'test');
  end loop;
  delete from push_log where at < now() - interval '10 days';
end $$;
revoke execute on function public.push_tick() from public, anon, authenticated;
