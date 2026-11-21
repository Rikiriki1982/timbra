# Attivare Timbra per una nuova ditta

Tempo: circa 20–30 minuti. Costo: 0 € (piano gratuito Supabase, sul conto del cliente).

Ogni ditta ha **il suo database**, separato da tutti gli altri. Il sito invece è uno solo: ogni ditta usa
il suo link personale, tipo `https://rikiriki1982.github.io/timbra/?ditta=rossi`.
La tua ditta (Lumia) resta la predefinita: il tuo link e la tua app non cambiano.

## Cosa serve
- Un account Supabase **del cliente** (il piano gratuito permette 2 progetti per account, quindi ogni cliente
  usa il suo). Il cliente può invitarti nella sua organizzazione Supabase, così lo gestisci tu.
- L'accesso al repository GitHub `timbra` (per aggiungere una riga a `config.js`).

## Passo 1 – Crea il progetto Supabase
1. Su [supabase.com](https://supabase.com/dashboard) (account del cliente) → **New project**.
2. Nome: per esempio `timbra-rossi`. Regione: **Europe (Frankfurt o Milan)**. Scegli una password del database e conservala.
3. Attendi un paio di minuti che il progetto sia pronto.

## Passo 2 – Prepara il database
1. Nel progetto del cliente apri **SQL Editor → New query**.
2. Copia **tutto** il contenuto di `supabase/setup.sql` (dal repository), incollalo e premi **Run**.
   Deve finire con "Success". Si può rieseguire senza perdere dati.

## Passo 3 – Carica le funzioni
In **Edge Functions → Deploy a new function → Via Editor**, crea queste funzioni copiando il file `index.ts`
dalla cartella `supabase/functions/<nome>/` del repository:

| Funzione | Serve per | Obbligatoria |
|---|---|---|
| `invite-user` | invitare i dipendenti | sì |
| `send-push` | notifiche sul telefono. Dopo averla creata, nelle sue impostazioni **spegni "Verify JWT"** | sì |
| `transcribe` | vocali trascritti nei ticket (serve una chiave Groq gratuita nei Secrets: `GROQ_API_KEY`) | no |
| `cerca-azienda` | ricerca P.IVA nei preventivi (copia anche `lookup.ts`) | no |

## Passo 4 – Usa la pagina "Attiva una nuova ditta"
Apri `https://rikiriki1982.github.io/timbra/installa/`. Inserisci:
- un **codice** breve per la ditta (es. `rossi`)
- **Project URL** e chiave **anon / public** (Supabase → Project Settings → API). **Mai** la chiave `service_role`.

Premi **Prepara**. La pagina ti dà tre cose da copiare:
1. **SQL per le notifiche** → incollalo nell'SQL Editor del cliente e premi Run. Contiene una chiave privata: non mandarla a nessuno.
2. **Riga per `config.js`** → su GitHub apri `config.js`, matita ✏️, incolla la riga sotto quella di `lumia`, **Commit changes**.
   Il sito si aggiorna da solo in 1–2 minuti.
3. **Link personale** → mettilo in Supabase del cliente: **Authentication → URL Configuration**, sia in **Site URL**
   sia in **Redirect URLs**.

## Passo 5 – Sicurezza e primo accesso
1. **Authentication → Sign In / Providers**: spegni **"Allow new users to sign up"**. Così si entra solo su invito.
   (Anche se restasse accesa, chi si iscrive da solo nasce disattivato e non vede nulla.)
2. **Authentication → Users → Add user → Create new user**: email e password del titolare, con **Auto Confirm** attivo.
   È il primo account, quindi diventa automaticamente **Proprietario**.
3. Manda al titolare il link personale. Al primo accesso compila **"Benvenuto! Imposta la tua ditta"**
   (nome, logo, intestazione, orari). Quei dati vengono usati anche come punto di partenza dei preventivi.
4. Dal Team il titolare invita Admin e dipendenti.

## Aggiornamenti futuri
Il codice dell'app si aggiorna per tutti insieme (un solo sito). Quando un aggiornamento richiede una
modifica al database, l'SQL va eseguito **nel progetto di ogni cliente**, uno per uno.
Tieni un elenco dei clienti con il link al loro SQL Editor.

## Limiti del piano gratuito (per cliente)
- 500 MB di database, 1 GB di file, 50.000 utenti attivi al mese: abbondanti per una piccola ditta.
- Se nessuno usa l'app per 7 giorni il progetto va in pausa (si riattiva dalla dashboard). Con le timbrature quotidiane non succede.
- Nessun backup automatico: il backup settimanale già attivo copre solo Lumia. Per un cliente pagante conviene il piano Pro
  (circa 25 $/mese) oppure aggiungere il suo progetto al backup settimanale.
