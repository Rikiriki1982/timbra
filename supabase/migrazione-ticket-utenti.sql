-- Chi crea un ticket può assegnarlo ai colleghi e ai gruppi. Si può rieseguire senza perdere dati.

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

-- protezioni sui ticket: sul proprio ticket l'utente sceglie gli assegnatari (solo utenti attivi); su un ticket assegnato da altri cambia solo lo stato
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
