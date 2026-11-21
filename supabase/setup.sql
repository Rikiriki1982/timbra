-- Presenze & Ticket Pro (Timbra): installazione completa del database
--
-- Supabase > SQL Editor > New query > incolla TUTTO > Run.
-- Serve per una ditta nuova. Si può anche rieseguire senza perdere dati (non cancella timbrature,
-- richieste, ticket, preventivi o utenti), quindi va bene anche su un database già installato.
-- Fuso orario per "oggi": Europe/Rome (cambialo in can_write_doc e days_stamp se serve).
--
-- Ogni funzione e ogni regola compare UNA volta sola, nella sua versione attuale.
-- Prima di cambiare questo file: i controlli automatici su GitHub lo installano su un database vuoto,
-- lo rieseguono una seconda volta e provano le regole principali (cartella tests/db).
--
-- Indice
--   1) Estensioni
--   2) Tabelle
--   3) Funzioni di supporto (ruoli, permessi, festività, colleghi)
--   4) Regole di accesso (chi vede e chi modifica cosa)
--   5) Protezioni (cosa un utente non può cambiare da solo)
--   6) Timbrature: ora del server e storico modifiche
--   7) Notifiche nell'app e sul telefono (push)
--   8) Preventivi: storico delle modifiche
--   9) Nuovi utenti e primo accesso
--  10) Aggiornamenti in tempo reale e archivio vocali
--  11) Pulizia di versioni molto vecchie

-- 1) ESTENSIONI (chiamate alla funzione send-push e promemoria ogni minuto)
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 2) TABELLE

-- profili: uno per utente, collegato all'accesso di Supabase
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
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  hr jsonb                                        -- orario settimanale e ore di ferie/permessi spettanti
);
alter table public.profiles enable row level security;
alter table public.profiles add column if not exists hr jsonb;   -- database installati prima di novembre 2026
-- chi ha invitato un utente può essere eliminato senza bloccare nulla (database installati prima)
do $$ declare n text; begin
  select conname into n from pg_constraint
   where conrelid = 'public.profiles'::regclass and contype = 'f'
     and confrelid = 'auth.users'::regclass
     and conkey = array[(select attnum from pg_attribute where attrelid = 'public.profiles'::regclass and attname = 'invited_by')];
  if n is not null then execute format('alter table public.profiles drop constraint %I', n); end if;
  alter table public.profiles add constraint profiles_invited_by_fkey foreign key (invited_by) references auth.users(id) on delete set null;
end $$;

-- dati: timbrature (days), richieste (reqs), ticket (tix), gruppi (groups), impostazioni (settings), preventivi (prev, prevq)
create table if not exists public.docs (
  coll text not null,
  id   text not null,
  data jsonb not null default '{}'::jsonb,
  primary key (coll, id)
);
alter table public.docs enable row level security;

-- notifiche nell'app: create dal database, non falsificabili dal browser
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

-- dispositivi che hanno attivato le notifiche sul telefono
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
-- chiavi e indirizzo della funzione send-push: leggibili solo dal server (nessuna regola di accesso)
create table if not exists public.push_config (k text primary key, v text not null);
alter table public.push_config enable row level security;
create table if not exists public.push_log (key text primary key, at timestamptz not null default now());
alter table public.push_log enable row level security;
revoke all on public.push_config, public.push_log from anon, authenticated;
-- notifica di prova chiesta da un utente
create table if not exists public.push_test (user_id uuid primary key references auth.users(id) on delete cascade, due timestamptz not null);
alter table public.push_test enable row level security;
revoke all on public.push_test from anon, authenticated;

-- storico delle timbrature: leggibile solo da Proprietario e Admin, nessuno lo può modificare dall'app
create table if not exists public.days_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  day_id text not null,          -- <id utente>_<data>
  emp uuid,                      -- dipendente della giornata
  by_user uuid,                  -- chi ha fatto la modifica (vuoto = sistema / pannello Supabase)
  action text not null check (action in ('insert','update','delete')),
  before jsonb,
  after jsonb
);
create index if not exists days_log_day on public.days_log (day_id, at);
alter table public.days_log enable row level security;

-- storico dei preventivi, del listino, dei clienti e dei dati azienda (solo le differenze, senza immagini)
create table if not exists public.prev_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  coll text not null,            -- prevq = preventivo, prev = listino / clienti / azienda
  doc_id text not null,
  by_user uuid,                  -- chi ha fatto la modifica (vuoto = sistema / pannello Supabase)
  action text not null check (action in ('insert','update','delete')),
  info jsonb,                    -- numero, cliente e oggetto del preventivo (per mostrarlo anche se poi viene cancellato)
  changes jsonb                  -- solo ciò che è cambiato
);
create index if not exists prev_log_doc on public.prev_log (coll, doc_id, at desc);
create index if not exists prev_log_at on public.prev_log (at desc);
alter table public.prev_log enable row level security;

-- 3) FUNZIONI DI SUPPORTO
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

-- elenco colleghi (solo nome, niente email) per scegliere a chi assegnare
create or replace function public.team_list() returns table(id uuid, name text, active boolean)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(p.name, ''), split_part(p.email, '@', 1)), (p.active and p.joined)
  from profiles p where public.my_role() is not null
$$;
revoke execute on function public.team_list() from public, anon;
grant execute on function public.team_list() to authenticated;

-- gruppi (nome e membri) leggibili da tutti gli utenti attivi
create or replace function public.team_groups() returns table(id text, data jsonb)
language sql stable security definer set search_path = public as $$
  select d.id, d.data from docs d where d.coll = 'groups' and public.my_role() is not null
$$;
revoke execute on function public.team_groups() from public, anon;
grant execute on function public.team_groups() to authenticated;

-- data di Pasqua (calendario gregoriano)
create or replace function public.easter_date(y int) returns date
language plpgsql immutable as $$
declare a int; b int; c int; d int; e int; f int; g int; h int; i int; k int; l int; m int; x int;
begin
  a := y % 19; b := y / 100; c := y % 100; d := b / 4; e := b % 4; f := (b + 8) / 25; g := (b - f + 1) / 3;
  h := (19 * a + b - d - g + 15) % 30; i := c / 4; k := c % 4; l := (32 + 2 * e + 2 * i - h - k) % 7;
  m := (a + 11 * h + 22 * l) / 451; x := h + l - 7 * m + 114;
  return make_date(y, x / 31, x % 31 + 1);
end $$;

-- festività nazionali + giorni in più delle Impostazioni ditta ("MM-GG" ogni anno oppure "AAAA-MM-GG")
create or replace function public.is_holiday(p_day date) returns boolean
language sql stable security definer set search_path = public as $$
  select to_char(p_day, 'MM-DD') in ('01-01','01-06','04-25','05-01','06-02','08-15','11-01','12-08','12-25','12-26')
      or p_day in (public.easter_date(extract(year from p_day)::int), public.easter_date(extract(year from p_day)::int) + 1)
      or exists (select 1 from docs s,
                   jsonb_array_elements(case when jsonb_typeof(s.data->'hol') = 'array' then s.data->'hol' else '[]'::jsonb end) h
                 where s.coll = 'settings' and s.id = 'company'
                   and h->>'d' in (to_char(p_day, 'YYYY-MM-DD'), to_char(p_day, 'MM-DD')))
$$;

create or replace function public.hhmm_min(t text, def int) returns int
language sql immutable as $$
  select case when t ~ '^\d{1,2}:\d{2}$' then split_part(t, ':', 1)::int * 60 + split_part(t, ':', 2)::int else def end
$$;

-- 4) REGOLE DI ACCESSO
-- profili: ognuno vede il proprio, Proprietario e Admin vedono tutti (nessun insert/delete: i profili nascono con l'invito)
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.my_role() in ('admin','super'));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.my_role() in ('admin','super'))
  with check (id = auth.uid() or public.my_role() in ('admin','super'));

-- dati: l'utente vede solo i propri e i ticket assegnati a lui; Admin e Proprietario tutto; le impostazioni le leggono tutti
drop policy if exists docs_read on public.docs;
create policy docs_read on public.docs for select to authenticated
  using (public.my_role() in ('admin','super') or coll = 'settings'
         or (coll in ('days','reqs','tix') and data->>'uid' = auth.uid()::text)
         or (coll = 'tix' and coalesce(data->'assignees' ? auth.uid()::text, false)));
drop policy if exists docs_ins on public.docs;
create policy docs_ins on public.docs for insert to authenticated with check (public.can_write_doc(coll, data));
drop policy if exists docs_upd on public.docs;
create policy docs_upd on public.docs for update to authenticated
  using (public.can_write_doc(coll, data)) with check (public.can_write_doc(coll, data));
drop policy if exists docs_del on public.docs;
create policy docs_del on public.docs for delete to authenticated using (public.can_write_doc(coll, data));
-- chi riceve un ticket può aggiornarlo (il trigger sotto lascia cambiare solo lo stato)
drop policy if exists docs_upd_assigned on public.docs;
create policy docs_upd_assigned on public.docs for update to authenticated
  using (coll = 'tix' and public.my_role() is not null and coalesce(data->'assignees' ? auth.uid()::text, false))
  with check (coll = 'tix' and public.my_role() is not null and coalesce(data->'assignees' ? auth.uid()::text, false));

-- regole di arrotondamento e tipi di permesso (settings/rules): le salvano anche gli Admin
drop policy if exists docs_rules_ins on public.docs;
create policy docs_rules_ins on public.docs for insert to authenticated
  with check (coll = 'settings' and id = 'rules' and public.my_role() in ('admin','super'));
drop policy if exists docs_rules_upd on public.docs;
create policy docs_rules_upd on public.docs for update to authenticated
  using (coll = 'settings' and id = 'rules' and public.my_role() in ('admin','super'))
  with check (coll = 'settings' and id = 'rules' and public.my_role() in ('admin','super'));

-- notifiche: Proprietario/Admin leggono quelle per loro, ognuno le proprie
drop policy if exists notif_read on public.notifications;
create policy notif_read on public.notifications for select to authenticated
  using ((to_user is null and public.my_role() in ('admin','super')) or to_user = auth.uid());
drop policy if exists notif_upd on public.notifications;
create policy notif_upd on public.notifications for update to authenticated
  using ((to_user is null and public.my_role() in ('admin','super')) or to_user = auth.uid())
  with check ((to_user is null and public.my_role() in ('admin','super')) or to_user = auth.uid());
-- dispositivi per le notifiche: ognuno solo i propri
drop policy if exists push_subs_own on public.push_subs;
create policy push_subs_own on public.push_subs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- storici: solo lettura per Proprietario e Admin
drop policy if exists days_log_read on public.days_log;
create policy days_log_read on public.days_log for select to authenticated
  using (public.my_role() in ('admin','super'));
drop policy if exists prev_log_read on public.prev_log;
create policy prev_log_read on public.prev_log for select to authenticated
  using (public.my_role() in ('admin','super'));
-- vocali dei ticket: archivio privato
drop policy if exists ticket_audio_ins on storage.objects;
create policy ticket_audio_ins on storage.objects for insert to authenticated
  with check (bucket_id = 'ticket-audio' and public.my_role() is not null);
drop policy if exists ticket_audio_sel on storage.objects;
create policy ticket_audio_sel on storage.objects for select to authenticated
  using (bucket_id = 'ticket-audio' and public.my_role() is not null);
drop policy if exists ticket_audio_del on storage.objects;
create policy ticket_audio_del on storage.objects for delete to authenticated
  using (bucket_id = 'ticket-audio' and (owner_id = auth.uid()::text or public.my_role() in ('admin','super')));
-- 5) PROTEZIONI
-- il dipendente non può cambiarsi da solo ruolo, permessi, orario e saldo ferie
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
    new.hr := old.hr;                                       -- orario e ferie: li imposta chi gestisce il team
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles for each row execute function public.profiles_guard();

-- richieste: l'utente non si approva da solo; ticket: sul proprio sceglie gli assegnatari (solo utenti attivi),
-- su un ticket assegnato da altri cambia solo lo stato
create or replace function public.docs_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if tg_op = 'DELETE' then c := old.coll; else c := new.coll; end if;
  if auth.uid() is null or coalesce(public.my_role(), '') <> 'user' or c not in ('reqs','tix') then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if c = 'tix' then
    if tg_op = 'DELETE' then return old; end if;
    if tg_op = 'INSERT' or old.data->>'uid' = auth.uid()::text then
      if jsonb_typeof(new.data->'assignees') = 'array' then
        new.data := jsonb_set(new.data, '{assignees}', coalesce((
          select jsonb_agg(v) from jsonb_array_elements_text(new.data->'assignees') v
           where v ~ '^[0-9a-f-]{36}$' and exists (select 1 from profiles p where p.id = v::uuid and p.active)), '[]'::jsonb));
      end if;
      return new;
    else
      new.data := old.data || jsonb_build_object('status',
        case when new.data->>'status' in ('Fare','Attesa','Fatto') then new.data->>'status' else old.data->>'status' end);
    end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
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

-- 6) TIMBRATURE: ORA DEL SERVER E STORICO MODIFICHE
-- Cosa fa:
--  a) Quando si preme "Timbra entrata" / "Timbra uscita" l'app manda punch = 'in' / 'out':
--     l'orario lo scrive il server (fuso Europe/Rome), non il telefono.
--  b) Ogni orario scritto a mano (dipendente o admin) viene marcato in_src/out_src = 'manual',
--     con quando (in_at/out_at) e chi (in_by/out_by) l'ha inserito. Il browser non può falsificare questi campi.
--  c) Ogni creazione, modifica o cancellazione di una giornata finisce in public.days_log,
--     leggibile solo da Proprietario e Admin e non modificabile da nessuno dall'app.

create or replace function public.days_stamp() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  p text := new.data->>'punch';
  hhmm text := to_char(now() at time zone 'Europe/Rome', 'HH24:MI');
  oggi text := to_char(now() at time zone 'Europe/Rome', 'YYYY-MM-DD');
  o jsonb := case when tg_op = 'UPDATE' then old.data else '{}'::jsonb end;
  d jsonb := new.data - 'punch';
  k text;
begin
  if new.coll <> 'days' then return new; end if;
  foreach k in array array['in', 'out'] loop
    d := d - (k || '_src') - (k || '_at') - (k || '_by');          -- i dati di controllo li scrive solo il server
    if p = k and d->>'date' = oggi then
      d := d || jsonb_build_object(k, hhmm, k || '_src', 'server', k || '_at', now(), k || '_by', auth.uid());
    elsif coalesce(d->>k, '') = '' then
      null;                                                          -- orario vuoto: niente da segnare
    elsif d->>k = coalesce(o->>k, '') then
      if o ? (k || '_src') then                                      -- orario invariato: resta com'era
        d := d || jsonb_build_object(k || '_src', o->(k || '_src'), k || '_at', o->(k || '_at'), k || '_by', o->(k || '_by'));
      end if;
    else
      d := d || jsonb_build_object(k || '_src', 'manual', k || '_at', now(), k || '_by', auth.uid());
    end if;
  end loop;
  new.data := d;
  return new;
end $$;
drop trigger if exists docs_stamp on public.docs;
create trigger docs_stamp before insert or update on public.docs for each row execute function public.days_stamp();

create or replace function public.days_log_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.docs; e uuid;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  if r.coll <> 'days' then return null; end if;
  if tg_op = 'UPDATE' and old.data = new.data then return null; end if;
  begin e := (r.data->>'uid')::uuid; exception when others then e := null; end;
  insert into days_log (day_id, emp, by_user, action, before, after)
  values (r.id, e, auth.uid(), lower(tg_op),
          case when tg_op <> 'INSERT' then old.data end,
          case when tg_op <> 'DELETE' then new.data end);
  return null;
end $$;
drop trigger if exists docs_days_log on public.docs;
create trigger docs_days_log after insert or update or delete on public.docs for each row execute function public.days_log_write();

-- 7) NOTIFICHE
-- richieste di ferie/permessi/malattia: avviso agli Admin, e al dipendente quando vengono approvate o rifiutate
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

-- ticket assegnato: avviso a chi lo riceve
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

-- permesso "a ore": ha orario di inizio e fine e non è a giornata intera
create or replace function public.req_hourly(q jsonb) returns boolean
language sql immutable as $$
  select coalesce(q->>'type', '') = 'permesso' and coalesce(q->>'full', '') <> 'true'
     and coalesce(q->>'hin', '') ~ '^\d{1,2}:\d{2}$' and coalesce(q->>'hout', '') ~ '^\d{1,2}:\d{2}$'
$$;

-- promemoria a orario: orario del singolo dipendente (o della ditta), niente nei festivi e nei giorni di riposo,
-- niente se c'è una ferie/permesso a giornata/malattia approvata o in attesa che copre oggi;
-- con un permesso a ore approvato l'entrata o l'uscita si spostano
create or replace function public.push_due(p_now timestamptz default now())
returns table(user_id uuid, title text, body text, tag text)
language plpgsql security definer set search_path = public as $$
declare cfg jsonb; tz text; l timestamp; d date; m int; tin int; tout int; dow int; fest boolean;
        r record; t record; day jsonb; sc jsonb; cov boolean; n int; due timestamptz; rem int; who uuid; hp jsonb;
begin
  select data into cfg from docs where coll = 'settings' and id = 'company';
  tz := coalesce(nullif(cfg->>'tz', ''), 'Europe/Rome');
  l := p_now at time zone tz; d := l::date; m := extract(hour from l)::int * 60 + extract(minute from l)::int;
  dow := extract(dow from l)::int;
  fest := public.is_holiday(d);

  if not fest then
    for r in select p.id, p.hr from profiles p where p.active and p.can_punch and exists (select 1 from push_subs s where s.user_id = p.id) loop
      if jsonb_typeof(r.hr->'wk') = 'object' then
        sc := r.hr->'wk'->(dow::text);
      elsif dow between 1 and 5 then
        sc := jsonb_build_object('in', cfg->>'in', 'out', cfg->>'out');
      else
        sc := null;
      end if;
      if sc is null or jsonb_typeof(sc) <> 'object' or coalesce(sc->>'in', '') = '' or coalesce(sc->>'out', '') = '' then continue; end if;
      tin := public.hhmm_min(sc->>'in', 540); tout := public.hhmm_min(sc->>'out', 1080);

      select data into day from docs where coll = 'days' and id = r.id::text || '_' || d::text;
      select exists (select 1 from docs q where q.coll = 'reqs' and q.data->>'uid' = r.id::text and q.data->>'status' in ('approved', 'pending')
                       and coalesce(q.data->>'type', '') <> 'modifica' and q.data->>'from' <= d::text
                       and coalesce(q.data->>'to', q.data->>'from') >= d::text
                       and not public.req_hourly(q.data)) into cov;
      if cov then continue; end if;
      -- permesso a ore approvato oggi: sposta l'entrata (permesso a inizio giornata) o l'uscita (a fine giornata)
      select q.data into hp from docs q where q.coll = 'reqs' and q.data->>'uid' = r.id::text and q.data->>'status' = 'approved'
         and public.req_hourly(q.data) and q.data->>'from' <= d::text and coalesce(q.data->>'to', q.data->>'from') >= d::text limit 1;
      if hp is not null then
        if public.hhmm_min(hp->>'hin', 0) <= tin then tin := public.hhmm_min(hp->>'hout', tin);
        elsif public.hhmm_min(hp->>'hout', 1440) >= tout then tout := public.hhmm_min(hp->>'hin', tout);
        end if;
      end if;
      if m >= tin and m < tout and coalesce(day->>'in', '') = '' and coalesce(day->>'off', '') in ('', 'false') then
        insert into push_log(key) values ('in:' || r.id || ':' || d) on conflict do nothing;
        get diagnostics n = row_count;
        if n = 1 then user_id := r.id; title := 'Timbra l''entrata'; body := 'Non hai ancora timbrato l''entrata (orario ' || to_char(make_time(tin / 60, tin % 60, 0), 'HH24:MI') || ').'; tag := 'in'; return next; end if;
      end if;
      if m >= tout and coalesce(day->>'in', '') <> '' and coalesce(day->>'out', '') = '' then
        insert into push_log(key) values ('out:' || r.id || ':' || d) on conflict do nothing;
        get diagnostics n = row_count;
        if n = 1 then user_id := r.id; title := 'Timbra l''uscita'; body := 'Sono le ' || to_char(make_time(tout / 60, tout % 60, 0), 'HH24:MI') || ': ricordati di timbrare l''uscita.' || case when hp is not null then ' Oggi sei in permesso dalle ' || (hp->>'hin') || ' alle ' || (hp->>'hout') || '.' else '' end; tag := 'out'; return next; end if;
      end if;
    end loop;
  end if;

  -- promemoria dei ticket con data, ora e "promemoria" impostati (invariato, anche nei festivi)
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

-- notifica di prova: parte entro un minuto, quando l'app è chiusa; risponde con il numero di dispositivi registrati
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

-- ogni minuto: promemoria e notifiche di prova
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
select cron.schedule('push-tick', '* * * * *', 'select public.push_tick()');

-- Da inserire una volta sola (con i tuoi valori; la chiave privata non va mai pubblicata):
--   insert into push_config(k, v) values ('fn_url', 'https://<progetto>.supabase.co/functions/v1/send-push'),
--     ('vapid_public', '...'), ('vapid_private', '...'), ('secret', '...') on conflict (k) do update set v = excluded.v;

-- 8) PREVENTIVI: STORICO DELLE MODIFICHE
-- Cosa fa:
--  Ogni creazione, modifica o cancellazione di un preventivo, del listino, dell'anagrafica clienti
--  o dei dati azienda finisce in public.prev_log: quando, chi, e cosa è cambiato.
--  Per risparmiare spazio (piano gratuito) si salva solo la differenza, senza le immagini.
--  Le bozze di lavoro (salvate di continuo mentre si scrive) non vengono registrate.
--  Il registro è leggibile solo da Proprietario e Admin e nessuno può modificarlo dall'app.

-- toglie le immagini (spesso molto grandi) prima di salvarle nel registro
create or replace function public.prev_strip(x jsonb) returns jsonb
language plpgsql immutable set search_path = public as $$
declare r jsonb; k text; v jsonb;
begin
  if x is null then return null; end if;
  case jsonb_typeof(x)
    when 'object' then
      r := '{}'::jsonb;
      for k, v in select * from jsonb_each(x) loop
        if k in ('img', 'logo', 'photo') and jsonb_typeof(v) = 'string' and v #>> '{}' <> '' then
          r := r || jsonb_build_object(k, '[immagine]');
        else
          r := r || jsonb_build_object(k, public.prev_strip(v));
        end if;
      end loop;
      return r;
    when 'array' then
      return coalesce((select jsonb_agg(public.prev_strip(e) order by i) from jsonb_array_elements(x) with ordinality t(e, i)), '[]'::jsonb);
    when 'string' then
      if left(x #>> '{}', 5) = 'data:' then return '"[immagine]"'::jsonb; end if;
      return x;
    else return x;
  end case;
end $$;

-- chiave di una voce di elenco: id (righe, listino) oppure nome (clienti)
create or replace function public.prev_key(e jsonb) returns text
language sql immutable as $$
  select case when jsonb_typeof(e) = 'object' then coalesce(e->>'id', nullif(lower(trim(e->>'nome')), '')) end
$$;

-- differenza tra due valori:
--   {"~": [prima, dopo]}                    valore cambiato
--   {"#": [{"k":..., "from":..., "to":...}]} elenco: voci aggiunte (from null), tolte (to null) o cambiate
--   {campo: differenza, ...}                 oggetto: solo i campi cambiati
create or replace function public.prev_diff(o jsonb, n jsonb) returns jsonb
language plpgsql immutable set search_path = public as $$
declare r jsonb := '{}'::jsonb; k text; d jsonb; items jsonb := '[]'::jsonb; e jsonb; f jsonb;
begin
  if o is not distinct from n then return null; end if;
  if jsonb_typeof(o) = 'object' and jsonb_typeof(n) = 'object' then
    for k in select jsonb_object_keys(o) union select jsonb_object_keys(n) loop
      d := public.prev_diff(o->k, n->k);
      if d is not null then r := r || jsonb_build_object(k, d); end if;
    end loop;
    return nullif(r, '{}'::jsonb);
  end if;
  if jsonb_typeof(o) = 'array' and jsonb_typeof(n) = 'array'
     and not exists (select 1 from jsonb_array_elements(o || n) x where public.prev_key(x) is null) then
    for e in select x from jsonb_array_elements(n) x loop                       -- aggiunte e modifiche
      f := (select x from jsonb_array_elements(o) x where public.prev_key(x) = public.prev_key(e) limit 1);
      if f is null then
        items := items || jsonb_build_array(jsonb_build_object('k', public.prev_key(e), 'from', null, 'to', public.prev_strip(e)));
      elsif f <> e then
        items := items || jsonb_build_array(jsonb_build_object('k', public.prev_key(e), 'from', public.prev_strip(f), 'to', public.prev_strip(e)));
      end if;
    end loop;
    for e in select x from jsonb_array_elements(o) x loop                       -- voci tolte
      if not exists (select 1 from jsonb_array_elements(n) x where public.prev_key(x) = public.prev_key(e)) then
        items := items || jsonb_build_array(jsonb_build_object('k', public.prev_key(e), 'from', public.prev_strip(e), 'to', null));
      end if;
    end loop;
    if jsonb_array_length(items) = 0 then
      return jsonb_build_object('~', jsonb_build_array('ordine', 'ordine'));   -- stesse voci, ordine diverso
    end if;
    return jsonb_build_object('#', items);
  end if;
  return jsonb_build_object('~', jsonb_build_array(public.prev_strip(o), public.prev_strip(n)));
end $$;

create or replace function public.prev_log_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.docs; ch jsonb; inf jsonb;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  if r.coll not in ('prev', 'prevq') then return null; end if;
  if r.coll = 'prev' and r.id not in ('listino', 'clienti', 'azienda') then return null; end if;   -- bozze: no
  if tg_op = 'UPDATE' and old.data = new.data then return null; end if;
  if r.coll = 'prevq' then
    inf := jsonb_build_object('numero', r.data->>'numero', 'cliente', r.data#>>'{cliente,nome}', 'oggetto', left(r.data->>'oggetto', 120));
  end if;
  ch := case tg_op
    when 'UPDATE' then public.prev_diff(old.data - 'aggiornato', new.data - 'aggiornato')
    when 'INSERT' then case when r.coll = 'prevq' then public.prev_strip(new.data) end
    else public.prev_strip(old.data) end;                    -- cancellazione: resta una copia (senza immagini)
  if tg_op = 'UPDATE' and ch is null then return null; end if;   -- è cambiata solo l'ora di salvataggio
  insert into prev_log (coll, doc_id, by_user, action, info, changes)
  values (r.coll, r.id, auth.uid(), lower(tg_op), inf, ch);
  return null;
end $$;
drop trigger if exists docs_prev_log on public.docs;
create trigger docs_prev_log after insert or update or delete on public.docs for each row execute function public.prev_log_write();

-- 9) NUOVI UTENTI
-- Cosa fa:
--  Il primo account creato in un database nuovo diventa il Proprietario.
--  Dopo, entra solo chi è stato invitato da Proprietario o Admin. Se qualcuno riuscisse a crearsi
--  un account da solo (iscrizioni libere lasciate accese in Supabase), il suo profilo nasce DISATTIVATO:
--  non vede nulla finché Proprietario o Admin non lo riattivano dal Team.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare has_owner boolean := exists (select 1 from profiles where role = 'super');
begin
  insert into profiles (id, email, name, role, active)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''),
          case when has_owner then 'user' else 'super' end,
          (not has_owner) or new.invited_at is not null)
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

-- 10) AGGIORNAMENTI IN TEMPO REALE E ARCHIVIO VOCALI
do $$ begin alter publication supabase_realtime add table public.docs; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.profiles; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notifications; exception when others then null; end $$;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ticket-audio', 'ticket-audio', false, 15728640, array['audio/*'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- 11) PULIZIA di versioni molto vecchie (non fa nulla su un database nuovo)
drop policy if exists docs_write on public.docs;
drop function if exists public.is_role(text[]);
