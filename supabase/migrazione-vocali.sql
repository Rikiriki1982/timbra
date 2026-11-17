-- Vocali allegati ai ticket (archivio privato). Si può rieseguire senza perdere dati.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ticket-audio', 'ticket-audio', false, 15728640, array['audio/*'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists ticket_audio_ins on storage.objects;
create policy ticket_audio_ins on storage.objects for insert to authenticated
  with check (bucket_id = 'ticket-audio' and public.my_role() is not null);
drop policy if exists ticket_audio_sel on storage.objects;
create policy ticket_audio_sel on storage.objects for select to authenticated
  using (bucket_id = 'ticket-audio' and public.my_role() is not null);
drop policy if exists ticket_audio_del on storage.objects;
create policy ticket_audio_del on storage.objects for delete to authenticated
  using (bucket_id = 'ticket-audio' and (owner_id = auth.uid()::text or public.my_role() in ('admin','super')));
