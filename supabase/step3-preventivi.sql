-- 17) PREVENTIVI: storico delle modifiche (21/11/2026)
-- Si può rieseguire senza perdere dati. Non modifica i preventivi già salvati.
--
-- Cosa fa:
--  Ogni creazione, modifica o cancellazione di un preventivo, del listino, dell'anagrafica clienti
--  o dei dati azienda finisce in public.prev_log: quando, chi, e cosa è cambiato.
--  Per risparmiare spazio (piano gratuito) si salva solo la differenza, senza le immagini.
--  Le bozze di lavoro (salvate di continuo mentre si scrive) non vengono registrate.
--  Il registro è leggibile solo da Proprietario e Admin e nessuno può modificarlo dall'app.

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
drop policy if exists prev_log_read on public.prev_log;
create policy prev_log_read on public.prev_log for select to authenticated
  using (public.my_role() in ('admin','super'));

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
