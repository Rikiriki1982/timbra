# Timbra – Presenze & Ticket Pro

Web app per timbrature, permessi/ferie, ticket e report mensili, con ruoli Proprietario / Admin / Utente e inviti via Supabase.

## Contenuto
- `index.html`, `config.js`, `manifest.webmanifest`, `sw.js`, icone: l'app (installabile come PWA)
- `supabase/setup.sql`: database, regole di accesso e notifiche (da incollare in Supabase → SQL Editor)
- `supabase/step1-timbrature.sql`: solo l'aggiornamento "timbrature affidabili" (ora del server, orari a mano segnalati con ✏️, storico modifiche). Già incluso in `setup.sql`: serve per aggiornare un database esistente senza rieseguire tutto.
- `supabase/step2-ferie-orari.sql`: solo l'aggiornamento "festività, orario per dipendente, saldo ferie e permessi". Già incluso in `setup.sql`: serve per aggiornare un database esistente senza rieseguire tutto.
- `supabase/functions/invite-user/index.ts`: funzione per gli inviti (Supabase → Edge Functions, nome `invite-user`)

## Più ditte
Ogni ditta cliente ha il suo progetto Supabase; il sito è uno solo. Le ditte sono elencate in `config.js` e si scelgono con `?ditta=codice` nel link (senza, si apre la prima). Per attivarne una nuova: `docs/GUIDA-NUOVA-DITTA.md` e la pagina `installa/`.
- `supabase/step4-piu-ditte.sql`: solo l'aggiornamento "iscrizioni solo su invito" (già incluso in `setup.sql`).

## Configurazione
1. Esegui `supabase/setup.sql` nel SQL Editor di Supabase.
2. Crea la funzione `invite-user` con il contenuto di `index.ts`.
3. In `config.js` inserisci Project URL e chiave **anon** (mai la chiave service role).
4. In Supabase → Authentication → URL Configuration imposta Site URL e Redirect URLs con l'indirizzo dell'app.
5. Pubblica con GitHub Pages (Settings → Pages → branch `main`, cartella root).
