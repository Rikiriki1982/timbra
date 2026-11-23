-- 22) TICKET: MATERIALE USATO E ORE DI LAVORO AL COMPLETAMENTO (23/11/2026)
-- Come si usa: Supabase > SQL Editor > New query > incolla TUTTO > Run.
-- Si può rieseguire senza perdere dati. Non modifica i ticket già salvati.
--
-- Cosa fa:
--  Finora un dipendente, sui ticket che gli hanno assegnato altri, poteva cambiare solo lo stato.
--  Da ora, quando completa il ticket, può salvare anche materiale usato, ore di lavoro, note
--  e link alla pagina OneNote (campo «rep») e la data di completamento. Il resto del ticket resta protetto.

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
        || case when jsonb_typeof(new.data->'doneAt') = 'number' then jsonb_build_object('doneAt', new.data->'doneAt') else '{}'::jsonb end;
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
