# Timbra – Presenze & Ticket Pro

Web app per timbrature, permessi/ferie, ticket e report mensili, con ruoli Proprietario / Admin / Utente e inviti via Supabase.

## Contenuto
- `index.html`, `config.js`, `manifest.webmanifest`, `sw.js`, icone: l'app (installabile come PWA)
- `supabase/setup.sql`: database, regole di accesso e notifiche (da incollare in Supabase → SQL Editor)
- `supabase/functions/invite-user/index.ts`: funzione per gli inviti (Supabase → Edge Functions, nome `invite-user`)

## Configurazione
1. Esegui `supabase/setup.sql` nel SQL Editor di Supabase.
2. Crea la funzione `invite-user` con il contenuto di `index.ts`.
3. In `config.js` inserisci Project URL e chiave **anon** (mai la chiave service role).
4. In Supabase → Authentication → URL Configuration imposta Site URL e Redirect URLs con l'indirizzo dell'app.
5. Pubblica con GitHub Pages (Settings → Pages → branch `main`, cartella root).
