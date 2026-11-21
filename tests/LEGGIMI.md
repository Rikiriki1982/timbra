# Controlli automatici

Questa cartella **non fa parte dell'app**: serve solo a controllare che l'app funzioni.

A ogni modifica GitHub apre l'app in un browser di prova, con un **database finto**
(`fake-supabase.js`), e prova le cose principali:

- apertura dell'app, accesso con email e password, scelta della ditta (`?ditta=`)
- timbratura entrata/uscita con l'orario del server, orari scritti a mano segnati come manuali
- richiesta ferie del dipendente e approvazione del titolare
- creazione di un ticket e chiusura
- preventivi: accesso solo per Proprietario/Admin, totali, PDF, archivio online, riapertura dal PDF,
  unione delle modifiche di due admin

Il risultato si vede su GitHub, scheda **Actions**: ✅ tutto bene, ❌ qualcosa si è rotto.

Per provarli sul computer (serve Node.js): `cd tests`, `npm ci`, `npx playwright install chromium`, `npm test`.
