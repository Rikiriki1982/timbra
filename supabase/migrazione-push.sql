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
