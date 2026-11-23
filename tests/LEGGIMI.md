# Controlli automatici

Questa cartella **non fa parte dell'app**: serve solo a controllare che l'app funzioni.

A ogni modifica GitHub apre l'app in un browser di prova, con un **database finto**
(`fake-supabase.js`), e prova le cose principali:

- apertura dell'app, accesso con email e password, scelta della ditta (`?ditta=`)
- `supabase/setup.sql`: si installa su un database vuoto, si riesegue senza errori e le regole funzionano
  (il primo utente è Proprietario, il dipendente non si approva le ferie, non timbra per altri, ecc.)
- timbratura entrata/uscita con l'orario del server, orari scritti a mano segnati come manuali
- richiesta ferie del dipendente e approvazione del titolare
- permesso a ore (dalle/alle) con tipo di permesso, uscita prevista in «Oggi», promemoria spostato all'ora del permesso
- arrotondamento degli orari: l'orario reale resta salvato, le ore si calcolano arrotondate
- creazione di un ticket e chiusura; storico modifiche del ticket (chi, quando, cosa)
- l'ordine dei file divisi in `js/` e `preventivi/js/` (`controlla-ordine.js`)
- preventivi: accesso solo per Proprietario/Admin, totali, PDF, archivio online, riapertura dal PDF,
  unione delle modifiche di due admin

Il risultato si vede su GitHub, scheda **Actions**: ✅ tutto bene, ❌ qualcosa si è rotto.

Per provarli sul computer (serve Node.js; per il database serve PostgreSQL e `bash tests/db/prova-database.sh`): `cd tests`, `npm ci`, `npx playwright install chromium`, `npm test`.
