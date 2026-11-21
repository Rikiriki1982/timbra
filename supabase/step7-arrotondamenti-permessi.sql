-- 20) ARROTONDAMENTO ORARI E PERMESSI A ORE (21/11/2026)
-- Si può rieseguire senza perdere dati. Non tocca utenti, timbrature, ferie, ticket o preventivi già salvati.
--
-- Cosa fa:
--  a) Anche gli Admin (non solo il Proprietario) possono salvare le regole di arrotondamento
--     e i tipi di permesso (documento settings/rules). Gli altri dati della ditta restano solo al Proprietario.
--  b) Promemoria sul telefono: un permesso a ore (es. dalle 16 alle 18) non spegne più i promemoria della giornata,
--     ma sposta l'orario: permesso a fine giornata = promemoria di uscita all'inizio del permesso;
--     permesso a inizio giornata = promemoria di entrata alla fine del permesso.

drop policy if exists docs_rules_ins on public.docs;
create policy docs_rules_ins on public.docs for insert to authenticated
  with check (coll = 'settings' and id = 'rules' and public.my_role() in ('admin','super'));
drop policy if exists docs_rules_upd on public.docs;
create policy docs_rules_upd on public.docs for update to authenticated
  using (coll = 'settings' and id = 'rules' and public.my_role() in ('admin','super'))
  with check (coll = 'settings' and id = 'rules' and public.my_role() in ('admin','super'));

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
