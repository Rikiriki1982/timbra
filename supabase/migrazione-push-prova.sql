-- Notifica di prova + niente promemoria durante ferie/permessi/malattia (anche se la richiesta è ancora in attesa).
-- Si può rieseguire senza perdere dati. Richiede la migrazione "push" già eseguita.

create table if not exists public.push_test (user_id uuid primary key references auth.users(id) on delete cascade, due timestamptz not null);
alter table public.push_test enable row level security;
revoke all on public.push_test from anon, authenticated;

-- l'utente chiede una notifica di prova: parte entro un minuto, quando l'app è chiusa; risponde con il numero di dispositivi registrati
create or replace function public.push_test() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'Accesso richiesto'; end if;
  select count(*) into n from push_subs where user_id = auth.uid();
  if n > 0 then
    insert into push_test(user_id, due) values (auth.uid(), now() + interval '15 seconds')
      on conflict (user_id) do update set due = excluded.due;
  end if;
  return n;
end $$;
revoke execute on function public.push_test() from public, anon;
grant execute on function public.push_test() to authenticated;

-- promemoria: salta chi ha una richiesta (approvata o in attesa) che copre oggi
do $$
declare d text := pg_get_functiondef('public.push_due(timestamptz)'::regprocedure);
begin
  if position('q.data->>''status'' = ''approved''' in d) > 0 then
    d := replace(d, 'q.data->>''status'' = ''approved''', 'q.data->>''status'' in (''approved'', ''pending'')');
    execute d;
  end if;
end $$;

create or replace function public.push_tick() returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select * from push_due() loop
    perform push_notify(array[r.user_id], false, null, r.title, r.body, r.tag);
  end loop;
  for r in delete from push_test where due <= now() returning user_id loop
    perform push_notify(array[r.user_id], false, null, 'Notifica di prova', 'Le notifiche funzionano ✅', 'test');
  end loop;
  delete from push_log where at < now() - interval '10 days';
end $$;
revoke execute on function public.push_tick() from public, anon, authenticated;
