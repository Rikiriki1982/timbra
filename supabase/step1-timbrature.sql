-- 16) TIMBRATURE AFFIDABILI: ora del server + storico modifiche (21/11/2026)
-- Si può rieseguire senza perdere dati. Non modifica le timbrature già salvate.
--
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
-- solo lettura per Proprietario e Admin; nessuna regola di scrittura = nessuno può modificarlo dall'app
drop policy if exists days_log_read on public.days_log;
create policy days_log_read on public.days_log for select to authenticated
  using (public.my_role() in ('admin','super'));

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
