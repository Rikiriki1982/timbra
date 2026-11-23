-- Prove delle regole del database (eseguite dai controlli automatici dopo setup.sql).
-- Ogni "assert" che fallisce ferma tutto e il controllo su GitHub diventa rosso.
\set ON_ERROR_STOP on
set client_min_messages = warning;

-- utenti: il primo diventa Proprietario, gli invitati Utenti attivi, chi si iscrive da solo nasce disattivato
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-000000000001', 'titolare@prova.it', '{"name":"Titolare"}');
insert into auth.users (id, email, raw_user_meta_data, invited_at) values ('00000000-0000-4000-8000-000000000002', 'mario@prova.it', '{"name":"Mario"}', now());
insert into auth.users (id, email) values ('00000000-0000-4000-8000-000000000003', 'sconosciuto@prova.it');
do $$ begin
  assert (select role from public.profiles where email = 'titolare@prova.it') = 'super', 'il primo utente deve essere Proprietario';
  assert (select role || active from public.profiles where email = 'mario@prova.it') = 'usertrue', 'un invitato deve essere Utente attivo';
  assert (select active from public.profiles where email = 'sconosciuto@prova.it') = false, 'chi si iscrive da solo deve nascere disattivato';
end $$;
update auth.users set last_sign_in_at = now() where email = 'mario@prova.it';
do $$ begin assert (select joined from public.profiles where email = 'mario@prova.it'), 'primo accesso non segnato'; end $$;

-- festività
do $$ begin
  assert public.easter_date(2027) = date '2027-03-28', 'Pasqua 2027 sbagliata';
  assert public.is_holiday(date '2026-12-25') and public.is_holiday(date '2027-03-29'), 'Natale e Pasquetta devono essere festivi';
  assert not public.is_holiday(date '2026-11-17'), 'un martedì normale non è festivo';
end $$;

-- ===== da qui si agisce come Mario (dipendente) =====
do $$ begin perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false); end $$;
set role authenticated;

-- timbratura con "punch": l'orario lo scrive il server
insert into public.docs (coll, id, data) values ('days', '00000000-0000-4000-8000-000000000002_' || to_char(now() at time zone 'Europe/Rome', 'YYYY-MM-DD'),
  jsonb_build_object('uid', '00000000-0000-4000-8000-000000000002', 'date', to_char(now() at time zone 'Europe/Rome', 'YYYY-MM-DD'),
                     'in', '03:00', 'in_src', 'server', 'out', '', 'punch', 'in'));
do $$ declare d jsonb := (select data from public.docs where coll = 'days'); begin
  assert d->>'in' = to_char(now() at time zone 'Europe/Rome', 'HH24:MI'), 'l''entrata deve avere l''ora del server, non quella del telefono';
  assert d->>'in_src' = 'server' and not d ? 'punch', 'entrata non marcata dal server';
end $$;
-- orario scritto a mano: segnato come manuale, anche se il browser prova a dire "server"
update public.docs set data = data || '{"out":"23:59","out_src":"server"}' where coll = 'days';
do $$ begin assert (select data->>'out_src' from public.docs where coll = 'days') = 'manual', 'uscita a mano non segnata come manuale'; end $$;

-- non può timbrare per un collega né per un giorno passato
do $$ begin
  begin
    insert into public.docs (coll, id, data) values ('days', 'x1', jsonb_build_object('uid', '00000000-0000-4000-8000-000000000001', 'date', to_char(now() at time zone 'Europe/Rome', 'YYYY-MM-DD')));
    assert false, 'un dipendente non deve poter timbrare per un altro';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.docs (coll, id, data) values ('days', 'x2', jsonb_build_object('uid', '00000000-0000-4000-8000-000000000002', 'date', '2020-01-01'));
    assert false, 'un dipendente senza permesso non deve poter scrivere giorni passati';
  exception when insufficient_privilege then null; end;
end $$;

-- richiesta ferie: anche se il browser dice "approved" resta in attesa
insert into public.docs (coll, id, data) values ('reqs', 'r1', '{"uid":"00000000-0000-4000-8000-000000000002","type":"ferie","from":"2026-12-01","to":"2026-12-02","status":"approved"}');
do $$ begin assert (select data->>'status' from public.docs where id = 'r1') = 'pending', 'il dipendente non deve potersi approvare le ferie'; end $$;

-- non può cambiarsi ruolo né permessi
update public.profiles set role = 'super', can_edit_past = true, hr = '{"ferie":999}' where id = '00000000-0000-4000-8000-000000000002';
do $$ begin assert (select role || can_edit_past || coalesce(hr::text, '') from public.profiles where id = '00000000-0000-4000-8000-000000000002') = 'userfalse',
  'il dipendente non deve potersi cambiare ruolo, permessi o saldo ferie'; end $$;

-- non vede i dati del titolare né i preventivi; non legge gli storici
reset role;
insert into public.docs (coll, id, data) values ('prevq', 'p1', '{"numero":"1","cliente":{"nome":"Cliente Prova"},"oggetto":"Rete"}');
insert into public.docs (coll, id, data) values ('days', 'altro', '{"uid":"00000000-0000-4000-8000-000000000001","date":"2026-11-17","in":"09:00"}');
set role authenticated;
do $$ begin
  assert (select count(*) from public.docs where coll in ('prevq') or id = 'altro') = 0, 'il dipendente non deve vedere preventivi né giorni altrui';
  assert (select count(*) from public.days_log) = 0, 'il dipendente non deve leggere lo storico';
end $$;
reset role;

-- ===== ora agisce il titolare =====
do $$ begin perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false); end $$;
set role authenticated;
update public.docs set data = jsonb_set(data, '{status}', '"approved"') where id = 'r1';
reset role;
do $$ begin
  assert (select data->>'status' from public.docs where id = 'r1') = 'approved', 'il titolare deve poter approvare';
  assert (select count(*) from public.notifications where kind = 'decision' and to_user = '00000000-0000-4000-8000-000000000002') = 1, 'manca l''avviso al dipendente';
  assert (select count(*) from public.notifications where kind = 'req') = 1, 'manca l''avviso agli Admin per la richiesta';
  assert (select count(*) from public.days_log) >= 3, 'lo storico delle timbrature deve registrare ogni modifica';
  assert (select count(*) from public.prev_log where doc_id = 'p1' and info->>'cliente' = 'Cliente Prova') = 1, 'lo storico preventivi deve registrare il nuovo preventivo';
end $$;
set role authenticated;
-- il Proprietario non può togliersi il ruolo
update public.profiles set role = 'user', active = false where id = '00000000-0000-4000-8000-000000000001';
do $$ begin assert (select role || active from public.profiles where id = '00000000-0000-4000-8000-000000000001') = 'supertrue', 'il Proprietario non deve potersi declassare'; end $$;
-- ticket assegnato a Mario: lui riceve l'avviso
insert into public.docs (coll, id, data) values ('tix', 't1', '{"uid":"00000000-0000-4000-8000-000000000001","title":"Router","status":"Fare","assignees":["00000000-0000-4000-8000-000000000002"]}');
reset role;
do $$ begin assert (select count(*) from public.notifications where kind = 'ticket' and to_user = '00000000-0000-4000-8000-000000000002') = 1, 'manca l''avviso del ticket assegnato'; end $$;

-- Mario sul ticket assegnato può cambiare solo lo stato
do $$ begin perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false); end $$;
set role authenticated;
update public.docs set data = data || '{"status":"Fatto","title":"cambiato"}' where id = 't1';
reset role;
do $$ begin assert (select (data->>'status') || (data->>'title') from public.docs where id = 't1') = 'FattoRouter', 'sul ticket assegnato si cambia solo lo stato'; end $$;

-- arrotondamento e tipi di permesso (settings/rules): li salvano Proprietario e Admin, i dati ditta solo il Proprietario
do $$ begin perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false); end $$;
set role authenticated;
do $$ begin
  begin
    insert into public.docs (coll, id, data) values ('settings', 'rules', '{"rnd":{"inStep":15}}');
    assert false, 'un dipendente non deve poter cambiare l''arrotondamento';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false); end $$;
update public.profiles set role = 'admin', active = true where id = '00000000-0000-4000-8000-000000000003';
do $$ begin perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', false); end $$;
set role authenticated;
insert into public.docs (coll, id, data) values ('settings', 'rules', '{"rnd":{"inStep":15,"inDir":"up"}}');
update public.docs set data = '{"rnd":{"inStep":30,"inDir":"up"}}' where coll = 'settings' and id = 'rules';
do $$ begin
  assert (select data->'rnd'->>'inStep' from public.docs where coll = 'settings' and id = 'rules') = '30', 'l''Admin deve poter salvare l''arrotondamento';
  begin
    insert into public.docs (coll, id, data) values ('settings', 'company', '{"name":"altra"}');
    assert false, 'l''Admin non deve poter cambiare i dati della ditta';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- permesso a ore approvato (dalle 16 alle 18): il promemoria di uscita arriva alle 16, non alle 18
do $$ begin perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false); end $$;
insert into public.docs (coll, id, data) values ('settings', 'company', '{"name":"Prova","in":"09:00","out":"18:00","pause":60}') on conflict (coll, id) do nothing;
insert into public.push_subs (user_id, endpoint, p256dh, auth) values ('00000000-0000-4000-8000-000000000002', 'https://prova/1', 'x', 'y');
insert into public.docs (coll, id, data) values ('reqs', 'p1', '{"uid":"00000000-0000-4000-8000-000000000002","type":"permesso","kind":"rol","from":"2026-11-17","to":"2026-11-17","hin":"16:00","hout":"18:00","hours":2,"status":"approved"}');
insert into public.docs (coll, id, data) values ('days', '00000000-0000-4000-8000-000000000002_2026-11-17', '{"uid":"00000000-0000-4000-8000-000000000002","date":"2026-11-17","in":"09:00","out":""}');
do $$ begin
  assert (select count(*) from public.push_due(timestamptz '2026-11-17 15:50 Europe/Rome') where tag = 'out') = 0, 'troppo presto per il promemoria di uscita';
  assert (select count(*) from public.push_due(timestamptz '2026-11-17 16:01 Europe/Rome') where tag = 'out') = 1, 'con il permesso dalle 16 il promemoria di uscita deve arrivare alle 16';
end $$;

-- completamento del ticket: Mario, sul ticket assegnato da altri, salva anche materiale e ore (rep), ma non il resto
do $$ begin perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false); end $$;
insert into public.docs (coll, id, data) values ('tix', 't9', '{"uid":"00000000-0000-4000-8000-000000000001","title":"Caldaia","status":"Fare","assignees":["00000000-0000-4000-8000-000000000002"]}');
do $$ begin perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false); end $$;
set role authenticated;
update public.docs set data = data || '{"status":"Fatto","doneAt":1763900000000,"title":"cambiato","rep":{"mat":[{"d":"Valvola","q":"1"}],"min":90,"link":"https://onedrive.live.com/x"}}' where id = 't9';
reset role;
do $$ declare d jsonb := (select data from public.docs where id = 't9'); begin
  assert d->>'status' = 'Fatto' and d->>'title' = 'Caldaia', 'sul ticket assegnato il titolo non si cambia';
  assert (d->'rep'->>'min')::int = 90 and d->'rep'->'mat'->0->>'d' = 'Valvola', 'materiale e ore del completamento non salvati';
  assert (d->>'doneAt')::bigint = 1763900000000, 'data di completamento non salvata';
end $$;

-- listino per i ticket: Mario non legge il listino, ma dalla funzione riceve codice e nome, senza prezzi e senza manodopera
do $$ begin perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false); end $$;
insert into public.docs (coll, id, data) values ('prev', 'listino', '{"v":[{"id":"a1","cat":"mat","codice":"VS1","titolo":"Valvola","um":"pz","prezzo":12.5,"costo":7},{"id":"a2","cat":"man","descr":"Manodopera","um":"h","prezzo":40}]}')
  on conflict (coll, id) do update set data = excluded.data;
do $$ begin perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false); end $$;
set role authenticated;
do $$ begin
  assert (select count(*) from public.docs where coll = 'prev' and id = 'listino') = 0, 'il dipendente non deve leggere il listino con i prezzi';
  assert (select count(*) from public.listino_voci()) = 1, 'il dipendente deve vedere le voci del listino tranne la manodopera';
  assert (select codice || ' ' || titolo from public.listino_voci()) = 'VS1 Valvola', 'voce del listino sbagliata';
end $$;
reset role;

select 'Tutte le prove del database sono passate' as esito;
