-- 17) FESTIVITÀ, ORARIO PER DIPENDENTE, SALDO FERIE E PERMESSI (21/11/2026)
-- Si può rieseguire senza perdere dati. Non modifica timbrature, richieste o ticket già salvati.
--
-- Cosa fa:
--  a) Aggiunge ai profili la colonna hr: orario settimanale del dipendente e ore di ferie/permessi spettanti.
--     La modificano solo Proprietario e Admin (l'Admin solo per gli Utenti); il dipendente la può leggere ma non cambiare.
--  b) Riconosce le festività nazionali italiane (Pasqua e Pasquetta comprese) e i giorni in più
--     scritti nelle Impostazioni ditta (Santo Patrono, chiusure aziendali).
--  c) I promemoria di timbratura sul telefono seguono l'orario di ogni dipendente e non partono nei festivi.

alter table public.profiles add column if not exists hr jsonb;

-- il dipendente non può cambiarsi da solo orario e saldo ferie
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

-- promemoria a orario: orario del singolo dipendente (o della ditta), niente nei festivi e nei giorni di riposo,
-- niente se c'è una ferie/permesso/malattia approvata o in attesa che copre oggi
create or replace function public.push_due(p_now timestamptz default now())
returns table(user_id uuid, title text, body text, tag text)
language plpgsql security definer set search_path = public as $$
declare cfg jsonb; tz text; l timestamp; d date; m int; tin int; tout int; dow int; fest boolean;
        r record; t record; day jsonb; sc jsonb; cov boolean; n int; due timestamptz; rem int; who uuid;
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
