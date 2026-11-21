# Database

- **`setup.sql`** è il file da usare per **una ditta nuova** (vedi `docs/GUIDA-NUOVA-DITTA.md`).
  Contiene tutto il database nella versione attuale, ogni funzione una volta sola.
  Si può rieseguire senza perdere dati.
- Gli altri file (`step1-…`, `step2-…`, `migrazione-…`) sono **lo storico** degli aggiornamenti già fatti
  sui database esistenti. Non servono per una ditta nuova.
- Quando si cambia il database: aggiornare `setup.sql` **e** preparare il file di aggiornamento per i database
  già installati. I controlli automatici su GitHub provano `setup.sql` su un database vuoto
  (`tests/db/prova-database.sh`).
