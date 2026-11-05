-- Gruppi, ticket assegnati, eliminazione utenti. Si può rieseguire senza perdere dati.

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
