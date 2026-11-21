-- 19) ISCRIZIONI SOLO SU INVITO (21/11/2026)
-- Si può rieseguire senza perdere dati. Non tocca utenti, timbrature, ferie, ticket o preventivi già salvati.
--
-- Cosa fa:
--  Il primo account creato in un database nuovo diventa il Proprietario (come prima).
--  Dopo, entra solo chi è stato invitato da Proprietario o Admin. Se qualcuno riuscisse a crearsi
--  un account da solo (iscrizioni libere lasciate accese in Supabase), il suo profilo nasce DISATTIVATO:
--  non vede nulla finché Proprietario o Admin non lo riattivano dal Team.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare has_owner boolean := exists (select 1 from profiles where role = 'super');
begin
  insert into profiles (id, email, name, role, active)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''),
          case when has_owner then 'user' else 'super' end,
          (not has_owner) or new.invited_at is not null)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
