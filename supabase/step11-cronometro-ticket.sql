-- 24) TICKET: CRONOMETRO DEL LAVORO, AVVIO / PAUSA / FINE (23/11/2026)
-- Come si usa: Supabase > SQL Editor > New query > incolla TUTTO > Run.
-- Si può rieseguire senza perdere dati. Non modifica i ticket già salvati.
--
-- Cosa fa:
--  Nel ticket compaiono i pulsanti «Avvio lavori», «Pausa» e «Fine lavori». Ogni tecnico ha il suo cronometro.
--  Gli orari li scrive il server (non il telefono) e nessuno può cambiarli a mano.
--  Il totale precompila le ore di lavoro quando si completa il ticket; completare il ticket ferma tutti i cronometri.
--  Anche il dipendente che ha il ticket assegnato da altri può usare il proprio cronometro.

create or replace function public.tix_clock() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  a text := new.data->>'clk_do';
  me text := auth.uid()::text;
  t bigint := floor(extract(epoch from now()) * 1000);
  c jsonb := '{}'::jsonb;
  m jsonb; k text;
begin
  if new.coll <> 'tix' then return new; end if;
  new.data := new.data - 'clk_do';
  if me is null then return new; end if;                             -- pannello Supabase: nessun controllo
  if tg_op = 'UPDATE' and jsonb_typeof(old.data->'clk') = 'object' then c := old.data->'clk'; end if;
  if a in ('start', 'pause', 'stop') then
    m := coalesce(c->me, '{}'::jsonb);
    m := jsonb_build_object('ms', coalesce((m->>'ms')::bigint, 0)
           + case when m ? 'on' then greatest(t - (m->>'on')::bigint, 0) else 0 end);
    if a = 'start' then m := m || jsonb_build_object('on', t); end if;
    if a = 'stop' then m := m || '{"end": true}'::jsonb; end if;
    c := c || jsonb_build_object(me, m);
  end if;
  if tg_op = 'UPDATE' and new.data->>'status' = 'Fatto' and coalesce(old.data->>'status', '') <> 'Fatto' then
    for k in select jsonb_object_keys(c) loop
      if c->k ? 'on' then
        c := c || jsonb_build_object(k, jsonb_build_object('ms', coalesce((c->k->>'ms')::bigint, 0) + greatest(t - (c->k->>'on')::bigint, 0), 'end', true));
      end if;
    end loop;
  end if;
  if c = '{}'::jsonb then new.data := new.data - 'clk'; else new.data := new.data || jsonb_build_object('clk', c); end if;
  return new;
end $$;
drop trigger if exists docs_tix_clock on public.docs;
create trigger docs_tix_clock before insert or update on public.docs for each row execute function public.tix_clock();

-- il dipendente può usare il proprio cronometro anche sui ticket assegnati da altri
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
        case when new.data->>'status' in ('Fare','Attesa','Fatto') then new.data->>'status' else old.data->>'status' end)
        -- al completamento può scrivere anche materiale usato, ore di lavoro e pagina OneNote (rep) e la data di chiusura
        || case when jsonb_typeof(new.data->'rep') = 'object' then jsonb_build_object('rep', new.data->'rep') else '{}'::jsonb end
        || case when jsonb_typeof(new.data->'doneAt') = 'number' then jsonb_build_object('doneAt', new.data->'doneAt') else '{}'::jsonb end
        -- e può usare il proprio cronometro del lavoro (Avvio / Pausa / Fine: lo calcola il trigger tix_clock)
        || case when new.data->>'clk_do' in ('start','pause','stop') then jsonb_build_object('clk_do', new.data->'clk_do') else '{}'::jsonb end;
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
