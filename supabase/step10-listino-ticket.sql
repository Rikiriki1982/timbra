-- 23) TICKET: MATERIALE DAL LISTINO DEI PREVENTIVI (23/11/2026)
-- Come si usa: Supabase > SQL Editor > New query > incolla TUTTO > Run.
-- Si può rieseguire senza perdere dati. Non modifica listino né ticket.
--
-- Cosa fa:
--  Quando completa un ticket, il dipendente può scegliere il materiale dal listino dei preventivi.
--  Il listino resta visibile solo a Proprietario e Admin: ai dipendenti arrivano solo codice, nome e unità,
--  senza prezzi né costi.

-- listino per i ticket: i dipendenti scelgono il materiale usato dal listino dei preventivi,
-- ma vedono solo codice, nome e unità (niente prezzi né costi). Manodopera esclusa.
create or replace function public.listino_voci()
returns table (id text, codice text, titolo text, descr text, um text)
language sql stable security definer set search_path = public as $$
  select e->>'id', coalesce(e->>'codice', ''), coalesce(e->>'titolo', ''),
         left(split_part(coalesce(e->>'descr', ''), E'\n', 1), 200), coalesce(e->>'um', '')
    from public.docs d,
         jsonb_array_elements(case when jsonb_typeof(d.data->'v') = 'array' then d.data->'v' else '[]'::jsonb end) e
   where d.coll = 'prev' and d.id = 'listino' and public.my_role() is not null
     and jsonb_typeof(e) = 'object' and coalesce(e->>'cat', '') <> 'man'
$$;
revoke all on function public.listino_voci() from public, anon;
grant execute on function public.listino_voci() to authenticated;
