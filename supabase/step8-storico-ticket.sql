-- 21) TICKET: STORICO DELLE MODIFICHE (23/11/2026)
-- Come si usa: Supabase > SQL Editor > New query > incolla TUTTO > Run.
-- Si può rieseguire senza perdere dati. Non modifica i ticket già salvati.
--
-- Cosa fa:
--  Da ora ogni creazione, modifica o cancellazione di un ticket finisce in public.tix_log:
--  quando, chi, e quali campi sono cambiati (valore prima e dopo).
--  Le foto non vengono copiate (solo «[foto]»), così il registro resta piccolo (piano gratuito).
--  Lo vede chi vede il ticket (chi l'ha creato e chi ce l'ha assegnato); Proprietario e Admin vedono tutto,
--  anche lo storico dei ticket cancellati. Nessuno può modificarlo o cancellarlo dall'app.
--  Le modifiche fatte prima di oggi non sono ricostruibili.

create table if not exists public.tix_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  tix_id text not null,
  by_user uuid,                  -- chi ha fatto la modifica (vuoto = sistema / pannello Supabase)
  action text not null check (action in ('insert','update','delete')),
  title text,                    -- titolo del ticket (per riconoscerlo anche se poi viene cancellato)
  changes jsonb                  -- modifica: {campo: [prima, dopo]}; creazione / cancellazione: copia del ticket
);
create index if not exists tix_log_tix on public.tix_log (tix_id, at desc);
create index if not exists tix_log_at on public.tix_log (at desc);
alter table public.tix_log enable row level security;
drop policy if exists tix_log_read on public.tix_log;
create policy tix_log_read on public.tix_log for select to authenticated
  using (public.my_role() in ('admin','super')
         or (public.my_role() is not null and exists (select 1 from public.docs d where d.coll = 'tix' and d.id = tix_log.tix_id)));

-- valore da salvare nel registro: la foto diventa «[foto]»
create or replace function public.tix_val(k text, v jsonb) returns jsonb
language sql immutable as $$
  select case when k = 'photo' and coalesce(v #>> '{}', '') <> '' then '"[foto]"'::jsonb else v end
$$;
-- valore «vuoto» (assente, '', 0, [] o false): passare da assente a '' non è una modifica
create or replace function public.tix_empty(v jsonb) returns boolean
language sql immutable as $$
  select v is null or v in ('null'::jsonb, '""'::jsonb, '0'::jsonb, '[]'::jsonb, 'false'::jsonb, '{}'::jsonb)
$$;

create or replace function public.tix_log_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.docs; ch jsonb := '{}'::jsonb; k text; o jsonb; n jsonb;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  if r.coll <> 'tix' then return null; end if;
  if tg_op = 'UPDATE' then
    if old.data = new.data then return null; end if;
    for k in select jsonb_object_keys(old.data) union select jsonb_object_keys(new.data) loop
      -- campi di servizio: doneAt segue lo stato, assignUsers/groups sono già in assignees/gnames
      if k in ('doneAt', 'assignUsers', 'groups', 'created') then continue; end if;
      o := old.data->k; n := new.data->k;
      if o is not distinct from n or (public.tix_empty(o) and public.tix_empty(n)) then continue; end if;
      if k = 'photo' and not public.tix_empty(o) and not public.tix_empty(n) then
        ch := ch || jsonb_build_object(k, '["[foto]", "[nuova foto]"]'::jsonb);
      else
        ch := ch || jsonb_build_object(k, jsonb_build_array(public.tix_val(k, o), public.tix_val(k, n)));
      end if;
    end loop;
    if ch = '{}'::jsonb then return null; end if;
  else
    ch := (select coalesce(jsonb_object_agg(e.key, public.tix_val(e.key, e.value)), '{}'::jsonb) from jsonb_each(r.data) e);
  end if;
  insert into tix_log (tix_id, by_user, action, title, changes)
  values (r.id, auth.uid(), lower(tg_op), left(r.data->>'title', 200), ch);
  return null;
end $$;
drop trigger if exists docs_tix_log on public.docs;
create trigger docs_tix_log after insert or update or delete on public.docs for each row execute function public.tix_log_write();
